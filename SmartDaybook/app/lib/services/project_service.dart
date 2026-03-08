import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/project_model.dart';
import '../utils/constants.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ProjectService {
  static const String baseUrl = '${Constants.voxtreeApiUrl}/projects';

  static Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(Constants.voxtreeTokenKey);
  }

  static Future<List<ProjectModel>> getProjects() async {
    final token = await _getToken();
    final response = await http.get(
      Uri.parse(baseUrl),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      final Map<String, dynamic> body = jsonDecode(response.body);
      final List data = body['data'] ?? [];
      return data.map((e) => ProjectModel.fromJson(e)).toList();
    } else {
      throw Exception('Failed to load projects');
    }
  }
}
