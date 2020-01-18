export class Todo{

    public user: User

    constructor(
        public id:number,
        public title: string,
        public completed:boolean,
        public userId: number,
    ){}
}

export class User{
    constructor(
        public id: number,
        public name: string,
        public username: string
    ){}
}