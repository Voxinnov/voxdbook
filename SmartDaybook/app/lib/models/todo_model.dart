class TodoModel {
  final int id;
  final String title;
  final String? description;
  final String? dueDate;
  final String priority;
  final String status;

  TodoModel({
    required this.id,
    required this.title,
    this.description,
    this.dueDate,
    required this.priority,
    required this.status,
  });

  factory TodoModel.fromJson(Map<String, dynamic> json) {
    return TodoModel(
      id: json['id'],
      title: json['title'],
      description: json['description'],
      dueDate: json['due_date'] != null ? json['due_date'].toString().substring(0, 10) : null,
      priority: json['priority'] ?? 'medium',
      status: json['status'] ?? 'pending',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'title': title,
      'description': description,
      'due_date': dueDate,
      'priority': priority,
      'status': status,
    };
  }
}
