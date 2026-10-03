package com.crisis.realtime;

import com.crisis.incident.Incident;
import com.mongodb.client.model.changestream.ChangeStreamDocument;
import com.mongodb.client.model.changestream.FullDocument;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.messaging.ChangeStreamRequest;
import org.springframework.data.mongodb.core.messaging.DefaultMessageListenerContainer;
import org.springframework.data.mongodb.core.messaging.MessageListener;
import org.springframework.data.mongodb.core.messaging.MessageListenerContainer;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
public class IncidentChangeStreamListener {

    private final MongoTemplate mongoTemplate;
    private final SimpMessagingTemplate messagingTemplate;
    private MessageListenerContainer container;

    public IncidentChangeStreamListener(MongoTemplate mongoTemplate,
                                        SimpMessagingTemplate messagingTemplate) {
        this.mongoTemplate = mongoTemplate;
        this.messagingTemplate = messagingTemplate;
    }

    // Runs once at startup: opens the change stream on the incidents collection.
    @PostConstruct
    public void start() {
        container = new DefaultMessageListenerContainer(mongoTemplate);
        container.start();

        // For every change, push the full incident to the people allowed to see it.
        MessageListener<ChangeStreamDocument<Document>, Incident> listener = message -> {
            Incident incident = message.getBody();
            if (incident != null) {
                broadcast(incident);
            }
        };

        ChangeStreamRequest<Incident> request = ChangeStreamRequest.builder(listener)
                .collection("incidents")
                .fullDocumentLookup(FullDocument.UPDATE_LOOKUP)   // get the whole doc on updates too
                .build();

        container.register(request, Incident.class);
    }

    /**
     * Staff boards subscribe to their venue's topic and see every incident there. The reporter
     * also gets the incident on a private per-user queue, which is all a guest may subscribe to.
     */
    void broadcast(Incident incident) {
        messagingTemplate.convertAndSend("/topic/venue/" + incident.getVenueId(), incident);
        if (incident.getReportedBy() != null) {
            messagingTemplate.convertAndSendToUser(incident.getReportedBy(), "/queue/incidents", incident);
        }
    }

    @PreDestroy
    public void stop() {
        if (container != null) {
            container.stop();
        }
    }
}