package com.projectalpha.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.projectalpha.domain.Tag;
import com.projectalpha.domain.Ticket;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

@DataJpaTest
@ActiveProfiles("test")
class TicketRepositoryPhase1Test {

    @Autowired
    private TicketRepository ticketRepository;

    @Autowired
    private TagRepository tagRepository;

    @Test
    void saveTicket_identityGenerated_andManyToManyJoinTable() {
        Tag bug = new Tag();
        bug.setName("bug");
        tagRepository.save(bug);

        Ticket t = new Ticket();
        t.setTitle("demo");
        t.setDescription("long text");
        t.setCompleted(false);
        t.getTags().add(bug);

        ticketRepository.save(t);
        ticketRepository.flush();

        assertThat(t.getId()).isNotNull();
        List<Ticket> all = ticketRepository.findAll();
        assertThat(all).hasSize(1);
        assertThat(all.getFirst().getTags()).extracting(Tag::getName).containsExactly("bug");
    }
}
