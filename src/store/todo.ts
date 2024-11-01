import { useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  parentId?: string;
  childrenIds?: string[];
}
// gives us persistence
const todosAtom = atomWithStorage('todos', {} as Record<string, Todo>);

function createTodo(input: { title: string; parentId?: string }): Todo {
  const id = Math.random().toString(36).substring(7);
  return {
    id,
    title: input.title,
    completed: false,
    parentId: input.parentId,
  };
}

export function useTodos() {
  const [todos, setTodos] = useAtom(todosAtom);

  const deleteTodo = (id: string) => {
    setTodos(prev => {
      const todo = prev[id];
      if (todo.parentId) {
        const newChildrenIds = (prev[todo.parentId].childrenIds || []).filter(
          childId => childId !== id
        );
        return {
          ...prev,
          [todo.parentId]: {
            ...prev[todo.parentId],
            childrenIds: newChildrenIds,
          },
        };
      }
      const newTodos = { ...prev };
      delete newTodos[id];
      return newTodos;
    });
  };

  const addTodo = (input: { title: string; parentId?: string }) => {
    const todo = createTodo({
      title: input.title,
      parentId: input.parentId,
    });

    setTodos(prev => {
      if (todo.parentId) {
        const newChildrenIds = [...new Set([...(prev[todo.parentId].childrenIds || []), todo.id])];
        return {
          ...prev,
          [todo.id]: todo,
          [todo.parentId]: {
            ...prev[todo.parentId],
            childrenIds: newChildrenIds,
          },
        };
      }
      return { ...prev, [todo.id]: todo };
    });
  };

  const updateTodo = (input: { id: string; payload: Partial<Todo> }) => {
    setTodos(prev => {
      const parent = todos[input.id].parentId;
      if (parent) {
        const newChildrenIds = [...new Set([...(prev[parent].childrenIds || []), input.id])];
        return {
          ...prev,
          [input.id]: {
            ...prev[input.id],
            ...input.payload,
          },
          [parent]: {
            ...prev[parent],
            childrenIds: newChildrenIds,
          },
        };
      } else {
        return {
          ...prev,
          [input.id]: {
            ...prev[input.id],
            ...input.payload,
          },
        };
      }
    });
  };

  return {
    todos,
    addTodo,
    updateTodo,
    deleteTodo,
  };
}

// util to get the depth of a given todo
export function getDepth(todo: Todo, todos: Record<string, Todo>): number {
  let depth = 0;
  let currentTodo = todo;
  while (currentTodo.parentId) {
    depth++;
    currentTodo = todos[currentTodo.parentId];
  }
  return depth;
}
