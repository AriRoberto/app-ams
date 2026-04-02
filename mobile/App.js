import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3334/api';
const USER_KEY = 'amsUser';

const categories = [
  'ILUMINACAO_PUBLICA',
  'BURACO_EM_VIA',
  'LIMPEZA_URBANA',
  'MANUTENCAO_ESPACO_PUBLICO'
];

export default function App() {
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [registerForm, setRegisterForm] = useState({ nome: '', cpf: '', email: '' });
  const [requestForm, setRequestForm] = useState({
    category: categories[0],
    descricao: '',
    endereco: '',
    latitude: '',
    longitude: ''
  });

  useEffect(() => {
    AsyncStorage.getItem(USER_KEY).then((value) => {
      if (value) {
        const parsed = JSON.parse(value);
        setUser(parsed);
        loadRequests(parsed.id);
      }
    });
  }, []);

  async function requestJson(url, options) {
    const response = await fetch(url, options);
    const data = await response.json();
    if (!response.ok) {
      const error = new Error(data.message || 'Erro ao chamar API');
      error.status = response.status;
      error.payload = data;
      throw error;
    }
    return data;
  }

  async function loadRequests(userId = user?.id) {
    if (!userId) return;
    const data = await requestJson(`${API_URL}/requests?userId=${userId}`);
    setRequests(data);
  }

  async function register() {
    try {
      const data = await requestJson(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerForm)
      });
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setUser(data.user);
      Alert.alert('Sucesso', 'Usuário cadastrado.');
    } catch (error) {
      if (error.status === 409 && error.payload?.user) {
        setUser(error.payload.user);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(error.payload.user));
        Alert.alert('Info', 'Usuário já existia, sessão carregada.');
        return;
      }
      Alert.alert('Erro', error.message);
    }
  }

  async function createRequest() {
    if (!user) {
      Alert.alert('Atenção', 'Cadastre um usuário antes.');
      return;
    }

    try {
      const body = {
        ...requestForm,
        userId: user.id,
        latitude: Number(requestForm.latitude),
        longitude: Number(requestForm.longitude)
      };

      const data = await requestJson(`${API_URL}/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      Alert.alert('Solicitação criada', data.protocol);
      setRequestForm({ ...requestForm, descricao: '', endereco: '', latitude: '', longitude: '' });
      loadRequests();
    } catch (error) {
      Alert.alert('Erro', error.message);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>CidadeAtende Mobile</Text>
        <Text style={styles.subtitle}>API: {API_URL}</Text>

        <Text style={styles.section}>Cadastro cidadão</Text>
        <TextInput style={styles.input} placeholder="Nome" value={registerForm.nome} onChangeText={(v) => setRegisterForm({ ...registerForm, nome: v })} />
        <TextInput style={styles.input} placeholder="CPF" value={registerForm.cpf} onChangeText={(v) => setRegisterForm({ ...registerForm, cpf: v })} />
        <TextInput style={styles.input} placeholder="E-mail" value={registerForm.email} onChangeText={(v) => setRegisterForm({ ...registerForm, email: v })} />
        <Button title="Cadastrar / Entrar" onPress={register} />

        <Text style={styles.section}>Nova solicitação</Text>
        <Text style={styles.label}>Categoria atual: {requestForm.category}</Text>
        <View style={styles.categoryRow}>
          {categories.map((item) => (
            <Button key={item} title={item.replaceAll('_', ' ')} onPress={() => setRequestForm({ ...requestForm, category: item })} />
          ))}
        </View>
        <TextInput style={styles.input} placeholder="Descrição" value={requestForm.descricao} onChangeText={(v) => setRequestForm({ ...requestForm, descricao: v })} />
        <TextInput style={styles.input} placeholder="Endereço" value={requestForm.endereco} onChangeText={(v) => setRequestForm({ ...requestForm, endereco: v })} />
        <TextInput style={styles.input} placeholder="Latitude" value={requestForm.latitude} onChangeText={(v) => setRequestForm({ ...requestForm, latitude: v })} />
        <TextInput style={styles.input} placeholder="Longitude" value={requestForm.longitude} onChangeText={(v) => setRequestForm({ ...requestForm, longitude: v })} />
        <Button title="Enviar solicitação" onPress={createRequest} />

        <Text style={styles.section}>Meus protocolos</Text>
        <Button title="Atualizar" onPress={() => loadRequests()} />
        {requests.map((item) => (
          <View key={item.id} style={styles.card}>
            <Text>Protocolo: {item.protocol}</Text>
            <Text>Status: {item.status}</Text>
            <Text>Categoria: {item.category}</Text>
            <Text>{item.descricao}</Text>
          </View>
        ))}
      </ScrollView>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 16, gap: 10 },
  title: { fontSize: 24, fontWeight: '700' },
  subtitle: { fontSize: 12, color: '#555' },
  section: { marginTop: 16, fontSize: 18, fontWeight: '600' },
  label: { fontSize: 12, color: '#555' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10 },
  categoryRow: { gap: 8 },
  card: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginTop: 8 }
});
