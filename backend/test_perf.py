import time
import requests

# Mesurer le temps de réponse du /predict
start = time.time()
r = requests.post('http://localhost:8000/predict/', json={
    'type_alerte': 'CPU_HIGH', 'severite': 'CRITIQUE',
    'valeur_mesuree': 96, 'seuil': 85,
    'equipement': 'TUN-RTR-CORE-01', 'heure': 3, 'jour_semaine': 1
})
end = time.time()
print(f'Temps prediction ML : {(end-start)*1000:.1f} ms')

# Mesurer le temps du copilote RAG
start = time.time()
r = requests.post('http://localhost:8000/chat/', json={
    'question': 'Que faire si le CPU est eleve ?'
})
end = time.time()
data = r.json()
reponse = data['response']
print(f'Temps reponse copilote : {(end-start)*1000:.0f} ms')
print(f'Reponse: {reponse[:100]}...')