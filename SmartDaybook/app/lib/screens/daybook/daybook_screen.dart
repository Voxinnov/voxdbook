import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/transaction_provider.dart';
import '../../components/app_drawer.dart';
import 'add_transaction_screen.dart';

class DaybookScreen extends StatefulWidget {
  const DaybookScreen({super.key});

  @override
  State<DaybookScreen> createState() => _DaybookScreenState();
}

class _DaybookScreenState extends State<DaybookScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<TransactionProvider>(context, listen: false).fetchTransactions();
    });
  }

  @override
  Widget build(BuildContext context) {
    final txProvider = Provider.of<TransactionProvider>(context);

    return Scaffold(
      body: txProvider.isLoading
          ? const Center(child: CircularProgressIndicator())
          : txProvider.transactions.isEmpty
              ? const Center(child: Text('No transactions yet. Add one!'))
              : RefreshIndicator(
                  onRefresh: () => txProvider.fetchTransactions(),
                  child: ListView.builder(
                    itemCount: txProvider.transactions.length,
                    itemBuilder: (context, index) {
                      final tx = txProvider.transactions[index];
                      final isIncome = tx.type == 'income' || tx.type == 'credit';
                      
                      return ListTile(
                        leading: CircleAvatar(
                          backgroundColor: isIncome ? Colors.green.shade100 : Colors.red.shade100,
                          child: Icon(
                          isIncome ? Icons.currency_rupee : Icons.arrow_upward,
                            color: isIncome ? Colors.green : Colors.red,
                          ),
                        ),
                        title: Text(tx.description ?? (isIncome ? 'Income' : 'Expense')),
                        subtitle: Text(tx.transactionDate),
                        trailing: Text(
                          '${isIncome ? '+' : '-'}₹${tx.amount.toStringAsFixed(2)}',
                          style: TextStyle(
                            color: isIncome ? Colors.green : Colors.red,
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                        onLongPress: () {
                          // Show delete confirmation
                          showDialog(
                            context: context,
                            builder: (ctx) => AlertDialog(
                              title: const Text('Delete Transaction'),
                              content: const Text('Are you sure you want to delete this?'),
                              actions: [
                                TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
                                TextButton(
                                  onPressed: () {
                                    txProvider.deleteTransaction(tx.id);
                                    Navigator.pop(ctx);
                                  },
                                  child: const Text('Delete', style: TextStyle(color: Colors.red)),
                                )
                              ],
                            )
                          );
                        },
                      );
                    },
                  ),
                ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.push(context, MaterialPageRoute(builder: (_) => const AddTransactionScreen()));
        },
        child: const Icon(Icons.add),
      ),
    );
  }
}
