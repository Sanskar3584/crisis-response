package com.crisis.user;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface UserRepository extends MongoRepository<User, String> {

    User findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByVenueId(String venueId);
}
