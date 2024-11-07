import { ObjectId, MongoClient } from "mongodb";
import { ClientModel, GymModel } from "./types.ts";
import { fromModelToClient, fromModelToGym } from "./utils.ts";

const MONGO_URL = Deno.env.get("MONGO_URL");

if (!MONGO_URL) {
  console.error("You have to provide a MONGO_URL");
  Deno.exit(1);
}

const client = new MongoClient(MONGO_URL);
await client.connect();
console.info("Mongodb connected!");

const db = client.db("gimnasio");

const gymsCollection = db.collection<GymModel>("gyms");
const clientsCollection = db.collection<ClientModel>("clients");

const handler = async (req: Request): Promise<Response> => {
  try {
    const method = req.method;
    const url = new URL(req.url);
    const path = url.pathname;

    if (method === "POST") {
      if (path === "/client") {
        const client = await req.json();
        if (!client) return new Response("Bad request", {status: 400});
        if (!client.name || !client.dni || !client.phone) return new Response("Bad request", {status: 400});
        const findClient = await clientsCollection.findOne({dni: client.dni});
        if (findClient) return new Response("Client with Dni already exists", {status: 404});
        const newClient = await clientsCollection.insertOne({
          _id: new ObjectId(),
          name: client.name,
          dni: client.dni,
          phone: client.phone
        });
        return new Response(JSON.stringify(newClient), {status: 200});
      } else if (path === "/gym"){
        const gym = await req.json();
        if (!gym) return new Response("Bad request", {status: 400});
        if (!gym.name || !gym.phone) return new Response("Bad request", {status: 400});
        const newGym = await gymsCollection.insertOne({
          _id: new ObjectId(),
          name: gym.name,
          phone: gym.phone,
          clients: []
        });
        return new Response(JSON.stringify(newGym), {status: 200});
      }
    } else if (method === "GET") {
      if (path === "/gyms") {
        const findGyms = await gymsCollection.find().toArray();
        const finalGyms = await Promise.all(
          findGyms.map((elem) => fromModelToGym(elem, clientsCollection))
        )
        return new Response(JSON.stringify(finalGyms), {status: 200});
      } else if (path === "/clients") {
        const findClients = await clientsCollection.find().toArray();
        const finalClients = findClients.map((elem) => fromModelToClient(elem));
        return new Response(JSON.stringify(finalClients), {status: 200});
      } else if (path === "/client") {
        const id = url.searchParams.get("id");
        if (id) {
          const findClient = await clientsCollection.findOne({_id: new ObjectId(id)});
          if (!findClient) return new Response("NO client found", {status: 404});
          const finalClient = fromModelToClient(findClient);
          return new Response(JSON.stringify(finalClient), {status: 200});
        } else {
          return new Response("No id at url", {status: 400});
        }
      } else if (path === "/gym") {
        const id = url.searchParams.get("id");
        if (id) {
          const findGym = await gymsCollection.findOne({_id: new ObjectId(id)});
          if (!findGym) return new Response("NO gym found", {status: 404});
          const finalGym = await fromModelToGym(findGym, clientsCollection);
          return new Response(JSON.stringify(finalGym), {status: 200});
        } else {
          return new Response("No id at url", {status: 400});
        }
      }
    } else if (method === "DELETE") {
      if (path === "/gym") {
        const id = url.searchParams.get("id");
        if (id){
          const findGym = await gymsCollection.findOne({_id: new ObjectId(id)});
          if (!findGym) return new Response("NO gym found", {status: 404});
          const deleteGym = await gymsCollection.deleteOne(findGym);
          return new Response("Gym deleted!", {status: 200});
        } else {
          return new Response("NO id at url", {status: 400});
        }
      } else if (path === "/client") {
        const id = url.searchParams.get("id");
        if (id) {
          const findClient = await clientsCollection.findOne({_id: new ObjectId(id)});
          if (!findClient) return new Response("NO client found", {status: 404});
          const clientGym = await gymsCollection.updateMany({clients: new ObjectId(id)}, {$pull: {clients: new ObjectId(id)}});
          const deleteClient = await clientsCollection.deleteOne(findClient);
          return new Response("Client deleted!", {status: 200});
        } else {
          return new Response("NO id at url", {status: 400});
        }
      }
    } else if (method === "PUT") {
      if (path === "/gym") {
        const gym = await req.json();
        if (!gym) return new Response("Bad request", {status: 400});
        if (!gym.name || !gym.phone || !gym.clients) return new Response("Bad request", {status: 400});
        if (gym.clients) {
          const clients = await clientsCollection.find({_id: {$in: gym.clients.map((elem: string) => new ObjectId(elem))}}).toArray();
          if (clients.length !== gym.clients.length) {
            return new Response("Some clients not found", { status: 404 });
          }
        }
        const updateGym = await gymsCollection.updateOne({_id: new ObjectId(gym.id as string)}, {$set: {
          name: gym.name,
          phone: gym.phone,
          clients: gym.clients.map((elem: string) => new ObjectId(elem))
        }});
        return new Response(JSON.stringify(updateGym), {status: 200});
    }
  }

    return new Response(`NO se encuentra la ruta ${path}`, {status: 500});

  } catch (error) {
    console.log(error);
    throw new Error("error");
  }
}

Deno.serve({port: 3000}, handler);