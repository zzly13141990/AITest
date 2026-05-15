package com.projectalpha.repository;

import com.projectalpha.entity.Metadata;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MetadataRepository extends JpaRepository<Metadata, Long> {
    List<Metadata> findByConnectionId(Long connectionId);
    Page<Metadata> findByConnectionId(Long connectionId, Pageable pageable);
}