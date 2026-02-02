package com.surveylion.repository;

import com.surveylion.model.Survey;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SurveyRepository extends JpaRepository<Survey, String> {
    List<Survey> findByOwnerId(String ownerId);

    @Query("""
        SELECT s FROM Survey s
        WHERE (:statuses IS NULL OR s.status IN :statuses)
          AND (
            (:ownerIds IS NULL AND :ids IS NULL)
            OR (:ownerIds IS NOT NULL AND s.ownerId IN :ownerIds)
            OR (:ids IS NOT NULL AND s.id IN :ids)
          )
        """)
    Page<Survey> search(
        @Param("ownerIds") List<String> ownerIds,
        @Param("statuses") List<String> statuses,
        @Param("ids") List<String> ids,
        Pageable pageable
    );
}
