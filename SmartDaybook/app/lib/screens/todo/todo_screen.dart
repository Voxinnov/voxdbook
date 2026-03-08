import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/todo_model.dart';
import '../../providers/todo_provider.dart';
import '../../components/app_drawer.dart';
import 'add_todo_screen.dart';

class TodoScreen extends StatefulWidget {
  const TodoScreen({super.key});

  @override
  State<TodoScreen> createState() => _TodoScreenState();
}

class _TodoScreenState extends State<TodoScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<TodoProvider>(context, listen: false).fetchTodos();
    });
  }

  @override
  Widget build(BuildContext context) {
    final todoProvider = Provider.of<TodoProvider>(context);

    return Scaffold(
      body: todoProvider.isLoading
          ? const Center(child: CircularProgressIndicator())
          : todoProvider.todos.isEmpty
              ? const Center(child: Text('No to-dos yet! Add one below.'))
              : RefreshIndicator(
                  onRefresh: () => todoProvider.fetchTodos(),
                  child: ListView.builder(
                    itemCount: todoProvider.todos.length,
                    itemBuilder: (context, index) {
                      final todo = todoProvider.todos[index];
                      final isCompleted = todo.status == 'completed';

                      return ListTile(
                        leading: Checkbox(
                          value: isCompleted,
                          onChanged: (val) {
                            if (val != null) {
                              final updated = TodoModel(
                                id: todo.id,
                                title: todo.title,
                                description: todo.description,
                                priority: todo.priority,
                                status: val ? 'completed' : 'pending',
                                dueDate: todo.dueDate,
                              );
                              todoProvider.updateTodo(todo.id, updated);
                            }
                          },
                        ),
                        title: Text(
                          todo.title,
                          style: TextStyle(
                            decoration: isCompleted ? TextDecoration.lineThrough : null,
                            color: isCompleted ? Colors.grey : null,
                          ),
                        ),
                        subtitle: Text(todo.dueDate ?? 'No due date'),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            _priorityBadge(todo.priority),
                            IconButton(
                              icon: const Icon(Icons.delete, color: Colors.grey),
                              onPressed: () => todoProvider.deleteTodo(todo.id),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.push(context, MaterialPageRoute(builder: (_) => const AddTodoScreen()));
        },
        child: const Icon(Icons.add),
      ),
    );
  }

  Widget _priorityBadge(String priority) {
    Color color;
    switch (priority) {
      case 'high':
        color = Colors.red;
        break;
      case 'medium':
        color = Colors.orange;
        break;
      default:
        color = Colors.green;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(color: color.withOpacity(0.2), borderRadius: BorderRadius.circular(10)),
      child: Text(priority.toUpperCase(), style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.bold)),
    );
  }
}
