package com.splitwise.service;

import com.splitwise.dto.CreateExpenseRequest;
import com.splitwise.entity.*;
import com.splitwise.exception.AppException;
import com.splitwise.repository.ExpenseRepository;
import com.splitwise.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;
    private final GroupService groupService;

    @Transactional
    public Expense createExpense(CreateExpenseRequest request) {
        Group group = groupService.getGroupEntity(request.getGroupId());

        User paidBy = userRepository.findById(request.getPaidById())
                .orElseThrow(() -> new AppException("Payer not found", HttpStatus.NOT_FOUND));

        List<User> splitAmong = new ArrayList<>();
        if (request.getSplitAmongIds() != null && !request.getSplitAmongIds().isEmpty()) {
            for (Long userId : request.getSplitAmongIds()) {
                User u = userRepository.findById(userId)
                        .orElseThrow(() -> new AppException("User not found: " + userId, HttpStatus.NOT_FOUND));
                splitAmong.add(u);
            }
        } else {
            // Default: split among all group members
            splitAmong.addAll(group.getMembers());
        }

        Expense expense = Expense.builder()
                .description(request.getDescription())
                .amount(request.getAmount())
                .paidBy(paidBy)
                .group(group)
                .build();

        // Calculate equal split
        BigDecimal splitAmount = request.getAmount()
                .divide(BigDecimal.valueOf(splitAmong.size()), 2, RoundingMode.HALF_UP);

        List<ExpenseSplit> splits = new ArrayList<>();
        for (User user : splitAmong) {
            splits.add(ExpenseSplit.builder()
                    .user(user)
                    .expense(expense)
                    .amount(splitAmount)
                    .build());
        }
        expense.setSplits(splits);

        return expenseRepository.save(expense);
    }

    public List<Expense> getExpensesByGroup(Long groupId) {
        return expenseRepository.findByGroupId(groupId);
    }
}
