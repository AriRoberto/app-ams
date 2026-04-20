import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Alert, Button, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { fetchBairros, fetchGeoData, login, sendOccurrence } from '../src/api';

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

const statusFlow = [
  'Aberta',
  'Em análise',
  'Em atendimento',
  'Encaminhado ao Executivo',
  'Resposta do Executivo: Deferido ou Indeferido',
  'Concluída'
];

export default function AppScreen() {
  const [geo, setGeo] = useState(null);
  const [accessToken, setAccessToken] = useState('');
  const [bairros, setBairros] = useState([]);
  const [form, setForm] = useState({
    nomeCidadao: '',
    tipoOcorrencia: tipos[0],
    bairro: '',
    descricao: '',
    pontoReferencia: '',
    destinatario: 'PREFEITURA',
    emailDestino: '',
    requirementFormEnabled: false,
    requirementFormData: {
      assunto: '',
      texto: ''
    }
  });

  async function loginDemo() {
    try {
      const data = await login({ email: 'cidadao@demo.local', password: 'Cidadao@123' });
      setAccessToken(data.accessToken);
      Alert.alert('Sucesso', 'Login demo realizado.');
    } catch (error) {
      Alert.alert('Erro', error.message);
    }
  }

  async function loadGeo() {
    try {
      const [data, bairrosPayload] = await Promise.all([fetchGeoData(), fetchBairros()]);
      setGeo(data);
      setBairros(bairrosPayload.data || []);
      Alert.alert('Sucesso', `Geolocalização carregada (${data.source}).`);
    } catch (error) {
      Alert.alert('Erro', error.message);
    }
  }

  async function submit() {
    if (!accessToken) return Alert.alert('Atenção', 'Faça login demo antes de registrar.');
    if (!geo) return Alert.alert('Atenção', 'Carregue a geolocalização primeiro.');
    if (!form.bairro) return Alert.alert('Atenção', 'Selecione um bairro.');

    try {
      const payload = {
        ...form,
        requirementFormData: form.requirementFormEnabled ? form.requirementFormData : null,
        latitude: geo.lat,
        longitude: geo.lon,
        cidade: geo.nome,
        uf: geo.uf,
        ibge_id: geo.ibge_id
      };

      const result = await sendOccurrence(payload, accessToken);
      Alert.alert('Ocorrência registrada', result.emailPreview.assunto);
    } catch (error) {
      Alert.alert('Erro', error.message);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Geo Demo Mobile</Text>
        <Button title={accessToken ? 'Login demo ativo' : 'Entrar como cidadão demo'} onPress={loginDemo} />
        <Button title="Carregar geolocalização oficial" onPress={loadGeo} />
        <Text style={styles.small}>{geo ? `${geo.nome}/${geo.uf} (${geo.source})` : 'Sem geolocalização carregada'}</Text>

        <View style={styles.card}>
          <Text style={styles.subtitle}>Fluxo da solicitação</Text>
          {statusFlow.map((status, index) => (
            <Text key={status} style={styles.small}>{index + 1}. {status}</Text>
          ))}
        </View>

        <TextInput style={styles.input} placeholder="Nome do cidadão" value={form.nomeCidadao} onChangeText={(v) => setForm({ ...form, nomeCidadao: v })} />
        <Text style={styles.small}>Tipo atual: {form.tipoOcorrencia}</Text>
        <View style={styles.group}>
          {tipos.map((t) => <Button key={t} title={t.replaceAll('_', ' ')} onPress={() => setForm({ ...form, tipoOcorrencia: t })} />)}
        </View>
        <Text style={styles.small}>Bairro atual: {form.bairro || 'não selecionado'}</Text>
        <View style={styles.group}>
          {bairros.map((bairro) => <Button key={bairro} title={bairro} onPress={() => setForm({ ...form, bairro })} />)}
        </View>
        <TextInput style={styles.input} placeholder="Descrição" value={form.descricao} onChangeText={(v) => setForm({ ...form, descricao: v })} />
        <TextInput style={styles.input} placeholder="Ponto de referência" value={form.pontoReferencia} onChangeText={(v) => setForm({ ...form, pontoReferencia: v })} />
        <TextInput style={styles.input} placeholder="Email destino" value={form.emailDestino} onChangeText={(v) => setForm({ ...form, emailDestino: v })} />

        <View style={styles.switchRow}>
          <Text style={styles.subtitle}>Habilitar requerimento à Prefeitura</Text>
          <Switch
            value={form.requirementFormEnabled}
            onValueChange={(value) => setForm({ ...form, requirementFormEnabled: value })}
          />
        </View>

        {form.requirementFormEnabled ? (
          <View style={styles.card}>
            <Text style={styles.subtitle}>Modelo de requerimento</Text>
            <Text style={styles.small}>Estrutura preparada para receber o documento oficial quando estiver disponível.</Text>
            <TextInput
              style={styles.input}
              placeholder="Assunto do requerimento"
              value={form.requirementFormData.assunto}
              onChangeText={(v) => setForm({
                ...form,
                requirementFormData: { ...form.requirementFormData, assunto: v }
              })}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              multiline
              placeholder="Texto base do requerimento"
              value={form.requirementFormData.texto}
              onChangeText={(v) => setForm({
                ...form,
                requirementFormData: { ...form.requirementFormData, texto: v }
              })}
            />
          </View>
        ) : null}

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
  subtitle: { fontSize: 16, fontWeight: '700' },
  small: { color: '#555' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10 },
  textArea: { minHeight: 110, textAlignVertical: 'top' },
  group: { gap: 8 },
  card: { borderWidth: 1, borderColor: '#d8e2ef', borderRadius: 8, padding: 12, gap: 8 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }
});
