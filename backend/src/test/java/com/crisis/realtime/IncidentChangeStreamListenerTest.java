package com.crisis.realtime;

import com.crisis.incident.Incident;
import org.junit.jupiter.api.Test;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;

class IncidentChangeStreamListenerTest {

    @Test
    void broadcast_goesToTheVenueBoard_andToTheReportersPrivateQueue() {
        SimpMessagingTemplate messaging = mock(SimpMessagingTemplate.class);
        IncidentChangeStreamListener listener =
                new IncidentChangeStreamListener(mock(MongoTemplate.class), messaging);

        Incident incident = new Incident();
        incident.setVenueId("venue-1");
        incident.setReportedBy("guest-1");

        listener.broadcast(incident);

        verify(messaging).convertAndSend("/topic/venue/venue-1", incident);
        verify(messaging).convertAndSendToUser("guest-1", "/queue/incidents", incident);
        verifyNoMoreInteractions(messaging);
    }
}
