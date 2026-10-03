package com.crisis.incident;

import com.crisis.user.Role;
import com.crisis.user.User;
import com.crisis.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Tenant isolation on the REST side: users can only touch incidents in their own venue. */
@ExtendWith(MockitoExtension.class)
class IncidentServiceTest {

    @Mock IncidentRepository incidentRepository;
    @Mock IncidentEventRepository incidentEventRepository;
    @Mock UserRepository userRepository;

    @InjectMocks IncidentService incidentService;

    private void givenUser(String id, Role role, String venueId) {
        User user = new User();
        user.setId(id);
        user.setRole(role);
        user.setVenueId(venueId);
        when(userRepository.findById(id)).thenReturn(Optional.of(user));
    }

    private void givenIncident(String venueId, IncidentStatus status) {
        Incident incident = new Incident();
        incident.setId("inc-1");
        incident.setVenueId(venueId);
        incident.setStatus(status);
        when(incidentRepository.findById("inc-1")).thenReturn(Optional.of(incident));
    }

    @Test
    void updatingAnotherVenuesIncident_isForbidden() {
        givenUser("staff-1", Role.STAFF, "venue-1");
        givenIncident("venue-2", IncidentStatus.OPEN);

        assertThatThrownBy(() -> incidentService.updateStatus("staff-1", "inc-1", IncidentStatus.RESOLVED))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Not your venue");
        verify(incidentRepository, never()).save(any());
    }

    @Test
    void readingAnotherVenuesAuditLog_isForbidden() {
        givenUser("staff-1", Role.STAFF, "venue-1");
        givenIncident("venue-2", IncidentStatus.OPEN);

        assertThatThrownBy(() -> incidentService.getEvents("staff-1", "inc-1"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Not your venue");
    }

    @Test
    void staffCannotArchiveIncidents() {
        givenUser("staff-1", Role.STAFF, "venue-1");
        givenIncident("venue-1", IncidentStatus.RESOLVED);

        assertThatThrownBy(() -> incidentService.archive("staff-1", "inc-1"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Only managers");
        verify(incidentRepository, never()).save(any());
    }

    @Test
    void guestsOnlySeeTheirOwnReports() {
        givenUser("guest-1", Role.GUEST, "venue-1");
        when(incidentRepository.findActiveByVenueAndReporter("venue-1", "guest-1")).thenReturn(List.of());

        incidentService.listForVenue("guest-1");

        verify(incidentRepository).findActiveByVenueAndReporter("venue-1", "guest-1");
        verify(incidentRepository, never()).findActiveByVenue(any());
    }
}
