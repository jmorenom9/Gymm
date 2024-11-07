import {ObjectId} from "mongodb"

export type GymModel = {
    _id?: ObjectId,
    name: string,
    phone: string,
    clients: ObjectId[]
};

export type ClientModel = {
    _id: ObjectId,
    name: string,
    dni: string,
    phone: string,
}

export type Gym = {
    id: string,
    name: string,
    phone: string,
    clients: Client[]
}

export type Client = {
    id: string,
    name: string,
    dni: string,
    phone: string
}