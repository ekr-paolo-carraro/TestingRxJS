import { Component } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import {
  map,
  mergeMap,
  concatMap,
  mergeAll,
  filter,
  switchMap,
  toArray,
} from "rxjs/operators";
import { Todo, User } from "./model";
import { forkJoin, Observable } from "rxjs";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
})
export class AppComponent {
  title = "rxjs-test";

  observer = {
    next: function (reuslt) {
      console.log(reuslt);
    },

    error: function (err) {
      console.error(err);
    },

    complete: function () {
      console.log("Completed!");
    },
  };

  observerForForkTest = {
    next: function ([todos, users]) {
      console.log("todos response", todos);
      console.log("users response", users);

      todos.map((todo) => {
        let candidateUser: User = users.filter(
          (user) => user.id == todo.userId
        );
        todo.user = candidateUser;
        return todo;
      });

      console.log("first todo combined with users", todos[0]);
    },

    error: function (err) {
      console.error(err);
    },

    complete: function () {
      console.log("Completed!");
    },
  };

  constructor(private remote: HttpClient) {}

  testForkJoin(event) {
    forkJoin(
      this.remote.get<Todo[]>("http://jsonplaceholder.typicode.com/todos").pipe(
        map((todos) => {
          return todos.map((todo) => {
            let result: Todo = new Todo(
              todo.id,
              todo.title,
              todo.completed,
              todo.userId
            );
            return result;
          });
        }),
        map((todos) => {
          return todos.filter((todo) => todo.id < 20);
        })
      ),
      this.remote.get<User[]>("http://jsonplaceholder.typicode.com/users").pipe(
        map((users) => {
          return users.map((user) => {
            let result: User = new User(user.id, user.name, user.username);
            return result;
          });
        })
      )
    ).subscribe(this.observerForForkTest);
  }

  //concatenate 2 call in order to complete first result with depenedence (todo.user)
  testSingle(event) {
    this.remote
      .get<Todo>("http://jsonplaceholder.typicode.com/todos/3")
      .pipe(
        //map result in class
        map((todo) => {
          let result: Todo = new Todo(
            todo.id,
            todo.title,
            todo.completed,
            todo.userId
          );
          return result;
        }),
        //return 2nd observable to call user
        mergeMap((todo) => {
          return this.remote
            .get<User>(
              "http://jsonplaceholder.typicode.com/users/" + todo.userId
            )
            .pipe(
              //map to merge 2 object todo and user
              map((user) => {
                let result: User = new User(user.id, user.name, user.username);
                todo.user = result;
                return todo;
              })
            );
        })
      )
      .subscribe(this.observer);
  }

  //concatenate n calls in seqyebce to complete todo objects with depenedence (todo.user)
  testMultiple(event) {
    this.remote
      .get<Todo[]>("http://jsonplaceholder.typicode.com/todos")
      .pipe(
        //flat array return from call
        mergeAll(),
        //map in class
        map((todo) => {
          let result: Todo = new Todo(
            todo.id,
            todo.title,
            todo.completed,
            Math.floor(Math.random() * 10) + 1
          );
          return result;
        }),
        //filter some result
        filter((todo) => {
          return todo.id < 30;
        }),
        //sequence call to user
        //use mergeMap to start call immedately without keep initial todos order
        concatMap((todo) => {
          return this.remote
            .get<User>(
              "http://jsonplaceholder.typicode.com/users/" + todo.userId
            )
            .pipe(
              map((user) => {
                let result: User = new User(user.id, user.name, user.username);
                todo.user = result;
                return todo;
              })
            );
        }),
        //return unique array and not a observer stream as result
        toArray()
      )
      .subscribe(this.observer);
  }
}
