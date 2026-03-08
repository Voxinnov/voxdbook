class SubTaskModel {
  final int id;
  final String title;
  final String status;

  SubTaskModel({required this.id, required this.title, required this.status});

  factory SubTaskModel.fromJson(Map<String, dynamic> json) {
    return SubTaskModel(
      id: json['id'],
      title: json['title'],
      status: json['status'],
    );
  }
}

class TaskModel {
  final int id;
  final String title;
  final String? description;
  final String? startDate;
  final String? dueDate;
  final String priority;
  final String status;
  final List<SubTaskModel> subtasks;

  TaskModel({
    required this.id,
    required this.title,
    this.description,
    this.startDate,
    this.dueDate,
    required this.priority,
    required this.status,
    this.subtasks = const [],
  });

  factory TaskModel.fromJson(Map<String, dynamic> json) {
    var list = json['subtasks'] as List? ?? [];
    List<SubTaskModel> subTaskList = list.map((i) => SubTaskModel.fromJson(i)).toList();

    return TaskModel(
      id: json['id'],
      title: json['title'],
      description: json['description'],
      startDate: json['start_date'] != null ? json['start_date'].toString().substring(0, 10) : null,
      dueDate: json['due_date'] != null ? json['due_date'].toString().substring(0, 10) : null,
      priority: json['priority'] ?? 'medium',
      status: json['status'] ?? 'pending',
      subtasks: subTaskList,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'title': title,
      'description': description,
      'start_date': startDate,
      'due_date': dueDate,
      'priority': priority,
      'status': status,
    };
  }
}
