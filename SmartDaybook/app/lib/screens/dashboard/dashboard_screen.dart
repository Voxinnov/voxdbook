import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../../providers/auth_provider.dart';
import '../../providers/product_provider.dart';
import '../../providers/transaction_provider.dart';
import '../../providers/task_provider.dart';
import '../../components/app_drawer.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final productProvider = Provider.of<ProductProvider>(context, listen: false);
      if (productProvider.activeProduct == ProductType.voxdbook) {
        Provider.of<TransactionProvider>(context, listen: false).fetchTransactions();
        Provider.of<TaskProvider>(context, listen: false).fetchTasks();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final productProvider = Provider.of<ProductProvider>(context);
    final txProvider = Provider.of<TransactionProvider>(context);
    final taskProvider = Provider.of<TaskProvider>(context);

    final activeProduct = productProvider.activeProduct;

    // Calculate income vs expense for today (only for voxdbook)
    double todayIncome = 0;
    double todayExpense = 0;
    if (activeProduct == ProductType.voxdbook) {
      final todayStr = DateTime.now().toIso8601String().substring(0, 10);
      for (var tx in txProvider.transactions) {
        if (tx.transactionDate == todayStr) {
          if (tx.type == 'income' || tx.type == 'credit') todayIncome += tx.amount;
          if (tx.type == 'expense' || tx.type == 'debit') todayExpense += tx.amount;
        }
      }
    }

    final double balance = todayIncome - todayExpense;

    int pendingTasks = activeProduct == ProductType.voxdbook 
        ? taskProvider.tasks.where((t) => t.status == 'pending').length
        : 0;
    int overdueTasks = activeProduct == ProductType.voxdbook 
        ? taskProvider.tasks.where((t) => t.status == 'overdue').length
        : 0;

    Widget body;
    if (activeProduct == ProductType.voxtree) {
      body = _buildVoxtreeDashboard();
    } else if (txProvider.isLoading || taskProvider.isLoading) {
      body = const Center(child: CircularProgressIndicator());
    } else {
      body = RefreshIndicator(
        onRefresh: () async {
          await txProvider.fetchTransactions();
          await taskProvider.fetchTasks();
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Welcome, ${authProvider.user?['name'] ?? 'User'}!',
                  style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(child: _buildSummaryCard('Today\'s Income', todayIncome, Colors.green)),
                  const SizedBox(width: 10),
                  Expanded(child: _buildSummaryCard('Today\'s Expense', todayExpense, Colors.red)),
                ],
              ),
              const SizedBox(height: 10),
              _buildSummaryCard('Today\'s Balance', balance, balance >= 0 ? Colors.blue : Colors.orange),
              const SizedBox(height: 30),
              const Text('Task Overview', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(child: _buildTaskCard('Pending', pendingTasks, Colors.amber)),
                  const SizedBox(width: 10),
                  Expanded(child: _buildTaskCard('Overdue', overdueTasks, Colors.redAccent)),
                ],
              ),
              const SizedBox(height: 30),
              const Text('Income vs Expense (Today)', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 10),
              SizedBox(
                height: 200,
                child: PieChart(
                  PieChartData(
                    sectionsSpace: 2,
                    centerSpaceRadius: 40,
                    sections: [
                      PieChartSectionData(
                        color: Colors.green,
                        value: todayIncome > 0 ? todayIncome : 1, // Avoid 0 crash
                        title: 'Income',
                        radius: 50,
                        titleStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                      PieChartSectionData(
                        color: Colors.red,
                        value: todayExpense > 0 ? todayExpense : 1,
                        title: 'Expense',
                        radius: 50,
                        titleStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      body: body,
    );
  }

  Widget _buildSummaryCard(String title, double amount, Color color) {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            Text(title, style: const TextStyle(fontSize: 14, color: Colors.grey)),
            const SizedBox(height: 8),
            Text('₹${amount.toStringAsFixed(2)}',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: color)),
          ],
        ),
      ),
    );
  }

  Widget _buildTaskCard(String title, int count, Color color) {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            Text(title),
            const SizedBox(height: 8),
            Text('$count', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: color)),
          ],
        ),
      ),
    );
  }

  Widget _buildVoxtreeDashboard() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('VOXTREE Project Management',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
          const SizedBox(height: 10),
          const Text('Manage your professional projects and teams.',
              style: TextStyle(color: Colors.grey)),
          const SizedBox(height: 30),
          _buildFeatureComingSoon('Active Projects', Icons.folder_open),
          const SizedBox(height: 20),
          _buildFeatureComingSoon('Team Performance', Icons.query_stats),
          const SizedBox(height: 20),
          _buildFeatureComingSoon('Invoicing & Quotations', Icons.receipt_long),
        ],
      ),
    );
  }

  Widget _buildFeatureComingSoon(String title, IconData icon) {
    return Card(
      child: ListTile(
        leading: Icon(icon, color: Colors.blue),
        title: Text(title),
        subtitle: const Text('Feature integration in progress'),
        trailing: const Icon(Icons.chevron_right),
      ),
    );
  }
}
