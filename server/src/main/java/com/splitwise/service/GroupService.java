package com.splitwise.service;

import com.splitwise.dto.*;
import com.splitwise.entity.Expense;
import com.splitwise.entity.ExpenseSplit;
import com.splitwise.entity.Group;
import com.splitwise.entity.User;
import com.splitwise.exception.AppException;
import com.splitwise.repository.GroupRepository;
import com.splitwise.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GroupService {

    private final GroupRepository groupRepository;
    private final UserRepository userRepository;

    public GroupDTO createGroup(CreateGroupRequest request, User currentUser) {
        List<User> members = new ArrayList<>();
        members.add(currentUser);

        if (request.getMemberEmails() != null) {
            for (String email : request.getMemberEmails()) {
                userRepository.findByEmail(email).ifPresent(members::add);
            }
        }

        Group group = Group.builder()
                .name(request.getName())
                .description(request.getDescription())
                .members(members)
                .build();

        group = groupRepository.save(group);
        return toDTO(group);
    }

    public List<GroupDTO> getUserGroups(User user) {
        return groupRepository.findByMembersContaining(user)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public GroupDTO getGroupById(Long id) {
        Group group = groupRepository.findById(id)
                .orElseThrow(() -> new AppException("Group not found", HttpStatus.NOT_FOUND));
        return toDTO(group);
    }

    public Group getGroupEntity(Long id) {
        return groupRepository.findById(id)
                .orElseThrow(() -> new AppException("Group not found", HttpStatus.NOT_FOUND));
    }

    private GroupDTO toDTO(Group group) {
        List<UserDTO> memberDTOs = group.getMembers().stream()
                .map(AuthService::toDTO)
                .collect(Collectors.toList());

        // Convert expenses to DTOs
        List<ExpenseDTO> expenseDTOs = new ArrayList<>();
        if (group.getExpenses() != null) {
            for (Expense expense : group.getExpenses()) {
                expenseDTOs.add(toExpenseDTO(expense));
            }
        }

        return new GroupDTO(
                group.getId(),
                group.getName(),
                group.getDescription(),
                memberDTOs,
                expenseDTOs,
                group.getCreatedAt()
        );
    }

    private ExpenseDTO toExpenseDTO(Expense expense) {
        List<UserDTO> splitAmong = expense.getSplits().stream()
                .map(split -> AuthService.toDTO(split.getUser()))
                .collect(Collectors.toList());

        return new ExpenseDTO(
                expense.getId(),
                expense.getDescription(),
                expense.getAmount(),
                AuthService.toDTO(expense.getPaidBy()),
                expense.getGroup().getId(),
                splitAmong,
                expense.getCreatedAt()
        );
    }
}
