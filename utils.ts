import { Collection, ObjectId } from "mongodb";
import { ClientModel, GymModel, Gym, Client } from "./types.ts";

export const fromModelToGym = async (model: GymModel, clientsCollection: Collection<ClientModel>): Promise<Gym> => {
    const client = await clientsCollection.find({_id: {$in: model.clients}}).toArray();
    return {
        id: model._id!.toString(),
        name: model.name,
        phone: model.phone,
        clients: client.map((elem) => fromModelToClient(elem))
    }
}

export const fromModelToClient = (model: ClientModel) => ({
    id: model._id!.toString(),
    name: model.name,
    dni: model.dni,
    phone: model.phone
});