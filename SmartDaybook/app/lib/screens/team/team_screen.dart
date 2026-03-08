import 'package:flutter/material.dart';
import '../../components/app_drawer.dart';

class TeamScreen extends StatelessWidget {
  const TeamScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.people, size: 64, color: Colors.blue),
            SizedBox(height: 16),
            Text('Team Management', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            SizedBox(height: 8),
            Text('Manage your organization\'s employees and roles.', style: TextStyle(color: Colors.grey)),
            SizedBox(height: 24),
            Text('Integration coming soon...', style: TextStyle(fontStyle: FontStyle.italic)),
          ],
        ),
      ),
    );
  }
}
