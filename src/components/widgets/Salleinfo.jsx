"use client";

import { useEffect, useState } from "react";


export default ({room}) => {
    const [eventsData, setEventsData] = useState([])
    useEffect(()=>{
        let intervalID;
        const callAPI = async() => {
            try {
                const response = await fetch(`/api/getEvents?room=${room}`);
                if (!response.ok) {
                    throw new Error(`Response status: ${response.status}`);
                }
                const data = await response.json();
                setEventsData(data.items || []);
            } catch (error) {
                console.error("Erreur lors de la récupération des événements :",error.message);
                setEventsData([]);
            }
        }
        callAPI()

        intervalID = setInterval(callAPI, 15 * 60 * 1000);
        return () => clearInterval(intervalID);
    }, [room])
    return (
        <div>
            <span className="flex flex-col items-center justify-center text-xl font-bold">Room : {room}</span><br />
            <span>Date : {new Date().toLocaleDateString('fr-CH')}</span>
            {eventsData.length > 0 ? (
                eventsData.slice(0, 2).map((event, index) => (
                    <div key={index} className="grid">
                        <span>{new Date(event.debut).toLocaleString('fr-CH', {hour:"numeric", minute:"numeric"})} - {new Date(event.fin).toLocaleString('fr-CH', {hour:"numeric", minute:"numeric"})}</span>
                        <span>Sujet : {event.sujet}</span>
                        <span>organisateur : {event.organisateur}</span>
                        <hr />
                    </div>
                ))
            ) : (
                <div>Pas d'événement</div>
            )}  
        </div>
    );
}