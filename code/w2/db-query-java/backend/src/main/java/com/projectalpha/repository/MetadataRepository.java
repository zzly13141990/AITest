package com.projectalpha.repository;

import com.projectalpha.entity.Metadata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MetadataRepository extends JpaRepository<Metadata, Long> {
    List<Metadata> findByConnectionId(Long connectionId);
}