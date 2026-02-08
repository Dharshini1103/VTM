package com.taskmanager.repository;

import com.taskmanager.entity.Meeting;
import com.taskmanager.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MeetingRepository extends JpaRepository<Meeting, Long> {

    List<Meeting> findByCreatedBy(User createdBy);

    List<Meeting> findByAttendeesContaining(User attendee);

    @Query("SELECT m FROM Meeting m WHERE m.startDateTime >= :start AND m.endDateTime <= :end")
    List<Meeting> findByDateRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT m FROM Meeting m WHERE m.startDateTime >= :now ORDER BY m.startDateTime ASC")
    List<Meeting> findUpcomingMeetings(@Param("now") LocalDateTime now);

    @Query("SELECT m FROM Meeting m WHERE m.startDateTime >= :start AND m.startDateTime <= :end")
    List<Meeting> findMeetingsOnDate(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT m FROM Meeting m WHERE m.googleCalendarEventId IS NULL")
    List<Meeting> findMeetingsNotSyncedWithCalendar();

    boolean existsByGoogleCalendarEventId(String googleCalendarEventId);
}
