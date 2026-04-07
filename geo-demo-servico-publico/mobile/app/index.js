import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Alert, Button, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { fetchGeoData, sendOccurrence } from '../src/api';

const tipos = [
  'LAMPADA_QUEIMADA',
  'BURACO_NA_RUA',
  'MATO_ALTO',
  'ENTULHO',
  'VAZAMENTO',
  'PROBLEMA_ESCOLA',
  'PROBLEMA_POSTO_SAUDE',
  'PROBLEMA_PRACA',
  'OUTRO'
];

export default function AppScreen() {
  const [geo, setGeo] = useState(null);
  const [form, setForm] = useState({
    nomeCidadao: '',
    tipoOcorrencia: tipos[0],
    descricao: '',
    pontoReferencia: '',
    destinatario: 'PREFEITURA',
    emailDestino: ''
  });

  async function loadGeo() {
    try {
      const data = await fetchGeoData();
      setGeo(data);
      Alert.alert('Sucesso', `Geolocalização carregada (${data.source}).`);
    } catch (error) {
      Alert.alert('Erro', error.message);
    }
  }

  async function submit() {
    if (!geo) return Alert.alert('Atenção', 'Carregue a geolocalização primeiro.');

    try {
      const payload = {
        ...form,
        latitude: geo.lat,
        longitude: geo.lon,
        cidade: geo.nome,
        uf: geo.uf,
        ibge_id: geo.ibge_id
      };

      const result = await sendOccurrence(payload);
      Alert.alert('Ocorrência registrada', result.emailPreview.assunto);
    } catch (error) {
      Alert.alert('Erro', error.message);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Geo Demo Mobile</Text>
        <Button title="Carregar geolocalização oficial" onPress={loadGeo} />
        <Text style={styles.small}>{geo ? `${geo.nome}/${geo.uf} (${geo.source})` : 'Sem geolocalização carregada'}</Text>

        <TextInput style={styles.input} placeholder="Nome do cidadão" value={form.nomeCidadao} onChangeText={(v) => setForm({ ...form, nomeCidadao: v })} />
        <Text style={styles.small}>Tipo atual: {form.tipoOcorrencia}</Text>
        <View style={styles.group}>
          {tipos.map((t) => <Button key={t} title={t.replaceAll('_', ' ')} onPress={() => setForm({ ...form, tipoOcorrencia: t })} />)}
        </View>
        <TextInput style={styles.input} placeholder="Descrição" value={form.descricao} onChangeText={(v) => setForm({ ...form, descricao: v })} />
        <TextInput style={styles.input} placeholder="Ponto de referência" value={form.pontoReferencia} onChangeText={(v) => setForm({ ...form, pontoReferencia: v })} />
        <TextInput style={styles.input} placeholder="Email destino" value={form.emailDestino} onChangeText={(v) => setForm({ ...form, emailDestino: v })} />

        <Button title="Registrar ocorrência" onPress={submit} />
      </ScrollView>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 16, gap: 10 },
  title: { fontSize: 22, fontWeight: '700' },
  small: { color: '#555' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10 },
  group: { gap: 8 }
});
