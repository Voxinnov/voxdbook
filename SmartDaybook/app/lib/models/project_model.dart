class ProjectModel {
  final int id;
  final String name;
  final String? description;
  final String status;
  final String? startDate;
  final String? endDate;
  final double progress;

  ProjectModel({
    required this.id,
    required this.name,
    this.description,
    required this.status,
    this.startDate,
    this.endDate,
    this.progress = 0.0,
  });

  factory ProjectModel.fromJson(Map<String, dynamic> json) {
    return ProjectModel(
      id: json['id'],
      name: json['name'],
      description: json['description'],
      status: json['status'] ?? 'pending',
      startDate: json['startDate'],
      endDate: json['endDate'],
      progress: (json['progress'] ?? 0).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'status': status,
      'startDate': startDate,
      'endDate': endDate,
      'progress': progress,
    };
  }
}
