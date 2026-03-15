package com.splitwise.repository;

import com.splitwise.entity.Payment;
import com.splitwise.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByFromUserOrToUserOrderByPaidAtDesc(User fromUser, User toUser);
}
