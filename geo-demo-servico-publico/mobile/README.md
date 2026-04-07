# Mobile demo (Expo)

## Objetivo
Representar a experiência real do cidadão em dispositivo móvel para registro de ocorrência georreferenciada.

## Como executar
```bash
cd mobile
npm install
EXPO_PUBLIC_API_URL=http://10.0.2.2:3340/api npm run android
```

> iOS (macOS):
```bash
EXPO_PUBLIC_API_URL=http://localhost:3340/api npm run ios
```

## Fluxo
1. Carregar geolocalização oficial.
2. Preencher dados do cidadão e ocorrência.
3. Registrar ocorrência no backend da demo.
