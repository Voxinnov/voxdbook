import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/product_provider.dart';
import 'dashboard_screen.dart';
import '../daybook/daybook_screen.dart';
import '../todo/todo_screen.dart';
import '../tasks/task_screen.dart';
import '../reports/reports_screen.dart';
import '../projects/projects_screen.dart';
import '../team/team_screen.dart';
import '../../components/app_drawer.dart';

class MainNavigation extends StatefulWidget {
  const MainNavigation({super.key});

  @override
  State<MainNavigation> createState() => _MainNavigationState();
}

class _MainNavigationState extends State<MainNavigation> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    final productProvider = Provider.of<ProductProvider>(context);
    final activeProduct = productProvider.activeProduct;

    final List<Widget> screens = activeProduct == ProductType.voxdbook
        ? [
            const DashboardScreen(),
            const DaybookScreen(),
            const TodoScreen(),
            const TaskScreen(),
            const ReportsScreen(),
          ]
        : [
            const DashboardScreen(),
            const ProjectsScreen(),
            const TeamScreen(),
            const Center(child: Text('VOXTREE Invoices')),
            const Center(child: Text('VOXTREE Settings')),
          ];

    final List<BottomNavigationBarItem> navItems = activeProduct == ProductType.voxdbook
        ? const [
            BottomNavigationBarItem(icon: Icon(Icons.dashboard), label: 'Dashboard'),
            BottomNavigationBarItem(icon: Icon(Icons.book), label: 'Daybook'),
            BottomNavigationBarItem(icon: Icon(Icons.check_box), label: 'To-Do'),
            BottomNavigationBarItem(icon: Icon(Icons.list_alt), label: 'Tasks'),
            BottomNavigationBarItem(icon: Icon(Icons.bar_chart), label: 'Reports'),
          ]
        : const [
            BottomNavigationBarItem(icon: Icon(Icons.dashboard), label: 'Dashboard'),
            BottomNavigationBarItem(icon: Icon(Icons.folder), label: 'Projects'),
            BottomNavigationBarItem(icon: Icon(Icons.people), label: 'Team'),
            BottomNavigationBarItem(icon: Icon(Icons.receipt), label: 'Invoices'),
            BottomNavigationBarItem(icon: Icon(Icons.settings), label: 'Settings'),
          ];

    // Reset index if switching product and index out of bounds (though both have 5)
    if (_currentIndex >= screens.length) {
      _currentIndex = 0;
    }

    String getTitle() {
      final String productSuffix = activeProduct == ProductType.voxtree ? 'VOXTREE' : 'VOXdBOOK';
      switch (_currentIndex) {
        case 0: return 'Dashboard ($productSuffix)';
        case 1: return activeProduct == ProductType.voxdbook ? 'Daybook' : 'Projects';
        case 2: return activeProduct == ProductType.voxdbook ? 'To-Do' : 'Team';
        case 3: return activeProduct == ProductType.voxdbook ? 'Tasks' : 'Invoices';
        case 4: return activeProduct == ProductType.voxdbook ? 'Reports' : 'Settings';
        default: return 'VOX Apps';
      }
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(getTitle()),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16.0),
            child: Center(
              child: Text(
                activeProduct == ProductType.voxtree ? 'VOXTREE' : 'VOXdBOOK',
                style: const TextStyle(fontSize: 10, color: Colors.white70),
              ),
            ),
          ),
        ],
      ),
      drawer: const AppDrawer(),
      body: IndexedStack(
        index: _currentIndex,
        children: screens,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        selectedItemColor: Theme.of(context).primaryColor,
        unselectedItemColor: Colors.grey,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        items: navItems,
      ),
    );
  }
}
