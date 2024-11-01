import './App.css';
import { getDepth, useTodos } from './store/todo.ts';
import * as React from 'react';
import { Input } from '@/components/ui/input.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Checkbox } from '@/components/ui/checkbox.tsx';
import { ChevronDownIcon, ChevronUpIcon, Edit, PlusCircle, Trash } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.tsx';

function TodoInputCard(props: { onSubmit?: () => void; parentId?: string; todoId?: string }) {
  const { todos, addTodo, updateTodo } = useTodos();
  const currentTodo = props.todoId ? todos[props.todoId] : undefined;
  const [value, setValue] = React.useState(currentTodo ? currentTodo.title : '');
  const [error, setError] = React.useState('');
  const onSubmit = (query: string) => {
    // validation eventually
    if (!query) {
      setError('Please enter a todo');
      return;
    }
    if (currentTodo && props.todoId) {
      updateTodo({
        id: props.todoId,
        payload: {
          title: query,
        },
      });
    } else {
      addTodo({
        title: query,
        parentId: props.parentId,
      });
    }
    setError('');
    setValue('');
    props?.onSubmit?.();
  };

  return (
    <div className={'flex gap-3'}>
      <Input placeholder={'Add a todo'} onChange={e => setValue(e.target.value)} value={value} />
      {error && (
        <div>
          <small>{error}</small>
        </div>
      )}
      <Button
        onClick={e => {
          e.preventDefault();
          onSubmit(value);
        }}
      >
        {props.todoId ? 'Update' : 'Add'}
      </Button>
    </div>
  );
}

const TodoItem = (props: { todoId: string }) => {
  const { todos, updateTodo, deleteTodo } = useTodos();
  const [inputState, setShowInput] = React.useState('none' as 'edit' | 'create' | 'none');
  const [childrenVisible, setChildrenVisible] = React.useState(true);
  const todo = todos[props.todoId];
  const setCompleted = (completed: boolean) => {
    updateTodo({
      id: props.todoId,
      payload: {
        completed,
      },
    });
  };
  const depth = getDepth(todo, todos);
  return (
    <div>
      <div
        className={'w-full flex items-center justify-between border-b '}
        style={{
          paddingLeft: `${depth * 20}px`,
        }}
      >
        <div className="flex-1 flex items-center space-x-2 py-4">
          <Checkbox onCheckedChange={setCompleted} id={props.todoId} />
          <label
            htmlFor={props.todoId}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {todo.title}
          </label>
        </div>
        <div className={'flex gap-1'}>
          <Button
            variant="outline"
            size="icon"
            onClick={e => {
              e.preventDefault();
              if (todo.completed) return;
              if (inputState === 'edit') {
                setShowInput('none');
                return;
              }
              setShowInput('edit');
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={e => {
              e.preventDefault();
              deleteTodo(props.todoId);
            }}
          >
            <Trash className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={e => {
              e.preventDefault();
              if (inputState === 'create') {
                setShowInput('none');
                return;
              }
              setShowInput('create');
            }}
          >
            <PlusCircle className="h-4 w-4" />
          </Button>
          {todo.childrenIds?.length ? (
            <Button
              variant="outline"
              size="icon"
              onClick={e => {
                e.preventDefault();
                setChildrenVisible(!childrenVisible);
              }}
            >
              {childrenVisible ? <ChevronUpIcon /> : <ChevronDownIcon />}
            </Button>
          ) : null}
        </div>
      </div>

      {inputState === 'create' || inputState === 'edit' ? (
        <div className={'p-4'}>
          <TodoInputCard
            onSubmit={() => {
              setShowInput('none');
            }}
            parentId={props.todoId}
            todoId={inputState === 'edit' ? props.todoId : undefined}
          />
        </div>
      ) : null}
      <div>
        {childrenVisible ? (
          <>
            {todo.childrenIds?.map(childId => {
              return <TodoItem todoId={childId} key={childId} />;
            })}
          </>
        ) : null}
      </div>
    </div>
  );
};

const TodosList = () => {
  const { todos } = useTodos();

  const todosArr = Object.values(todos);
  if (!todosArr.length) {
    return <div>No todos</div>;
  }
  return (
    <div className={'w-full flex flex-col gap-3'}>
      {Object.values(todos).map(todo => {
        if (todo.parentId) return null;
        return <TodoItem todoId={todo.id} key={todo.id} />;
      })}
    </div>
  );
};

function App() {
  return (
    <main>
      <Card>
        <CardHeader>
          <CardTitle>Todos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={'w-full flex flex-col gap-3'}>
            <TodoInputCard />
            <TodosList />
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

export default App;
