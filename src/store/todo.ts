import { useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { SetStateAction } from 'jotai/vanilla/typeUtils';
type SetAtom<Args extends unknown[], Result> = (...args: Args) => Result;

// an abstract service that could be implemented with local state, a REST API, or a GraphQL API etc
interface TodoService {
  addTodo: (input: { title: string; parentId?: string }) => void;
  updateTodo: (input: { id: string; payload: Partial<Todo> }) => void;
  deleteTodo: (input: { id: string; parentId?: string; childrenIds?: string[] }) => void;
}

// jotai implementation of the todo service
function createJotaiTodoService(ctx: {
  getTodos: () => Record<string, Todo>;
  setTodos: SetAtom<[SetStateAction<Record<string, Todo>>], void>;
}): TodoService {
  return {
    addTodo: input => {
      const todo = createTodo({
        title: input.title,
        parentId: input.parentId,
      });

      ctx.setTodos(prev => {
        if (todo.parentId) {
          const newChildrenIds = [
            ...new Set([...(prev[todo.parentId].childrenIds || []), todo.id]),
          ];
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
    },
    deleteTodo: input => {
      ctx.setTodos(prev => {
        const todo = prev[input.id];
        if (todo.parentId) {
          const newChildrenIds = (prev[todo.parentId].childrenIds || []).filter(
            childId => childId !== input.id
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
        delete newTodos[input.id];
        return newTodos;
      });
    },
    updateTodo: input => {
      ctx.setTodos(prev => {
        const parent = ctx.getTodos()[input.id].parentId;
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
    },
  };
}

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

  const service = createJotaiTodoService({
    getTodos: () => todos,
    setTodos,
  });

  return {
    todos,
    addTodo: service.addTodo,
    updateTodo: service.updateTodo,
    deleteTodo: service.deleteTodo,
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
