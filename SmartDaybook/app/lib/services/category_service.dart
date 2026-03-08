import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/category_model.dart';
import '../utils/constants.dart';
import 'package:shared_preferences/shared_preferences.dart';

class CategoryService {
  static const String baseUrl = '${Constants.apiUrl}/categories';

  static Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(Constants.tokenKey);
  }

  static Future<List<CategoryModel>> getCategories() async {
    final token = await _getToken();
    final response = await http.get(
      Uri.parse(baseUrl),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      final List data = jsonDecode(response.body);
      return data.map((e) => CategoryModel.fromJson(e)).toList();
    } else {
      throw Exception('Failed to load categories');
    }
  }
}
