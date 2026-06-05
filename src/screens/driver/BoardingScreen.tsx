import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';

import firestore from '@react-native-firebase/firestore';

interface Passenger {
  id: string;
  name: string;
  seat: string;
  fromStop: string;
  toStop: string;
  status: 'BOARDED' | 'PENDING' | 'MISSED';
  ticketNumber: string;
}

const BoardingScreen: React.FC = () => {
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPassenger, setSelectedPassenger] = useState<Passenger | null>(null);
  const [showPassengerModal, setShowPassengerModal] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'BOARDED' | 'PENDING'>('ALL');

  // 🔥 FETCH DATA FROM FIREBASE
  useEffect(() => {
    const unsubscribe = firestore()
      .collection('passengers')
      .onSnapshot(snapshot => {
        const list: Passenger[] = [];

        snapshot.forEach(doc => {
          const data = doc.data();

          list.push({
            id: doc.id,
            name: data.name,
            seat: data.seat,
            fromStop: data.fromStop,
            toStop: data.toStop,
            status: data.status,
            ticketNumber: data.ticketNumber,
          });
        });

        setPassengers(list);
        setLoading(false);
      });

    return () => unsubscribe();
  }, []);

  // 🔥 STATUS UPDATE FUNCTION
  const updateStatus = async (id: string, status: 'BOARDED' | 'MISSED') => {
    try {
      await firestore().collection('passengers').doc(id).update({
        status: status,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const filteredPassengers = passengers.filter(p => {
    if (filter === 'ALL') return true;
    return p.status === filter;
  });

  const boardedCount = passengers.filter(p => p.status === 'BOARDED').length;
  const pendingCount = passengers.filter(p => p.status === 'PENDING').length;
  const missedCount = passengers.filter(p => p.status === 'MISSED').length;

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#1A237E" />
        <Text>Loading passengers...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#1A237E" barStyle="light-content" />

      <ScrollView style={styles.scrollView}>

        {/* STATUS COUNTS */}
        <View style={styles.statusContainer}>
          <Text>✅ Boarded: {boardedCount}</Text>
          <Text>⏳ Pending: {pendingCount}</Text>
          <Text>❌ Missed: {missedCount}</Text>
        </View>

        {/* FILTER BUTTONS */}
        <View style={styles.filterContainer}>
          {['ALL', 'BOARDED', 'PENDING'].map(item => (
            <TouchableOpacity
              key={item}
              style={[
                styles.filterBtn,
                filter === item && styles.activeFilter
              ]}
              onPress={() => setFilter(item as any)}
            >
              <Text style={{ color: filter === item ? '#fff' : '#000' }}>
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* PASSENGER LIST */}
        {filteredPassengers.map(passenger => (
          <TouchableOpacity
            key={passenger.id}
            style={styles.card}
            onPress={() => {
              setSelectedPassenger(passenger);
              setShowPassengerModal(true);
            }}
          >
            <Text style={styles.name}>{passenger.name}</Text>
            <Text>Seat: {passenger.seat}</Text>
            <Text>Ticket: {passenger.ticketNumber}</Text>
            <Text>Status: {passenger.status}</Text>
          </TouchableOpacity>
        ))}

      </ScrollView>

      {/* PASSENGER MODAL */}
      <Modal visible={showPassengerModal} animationType="slide">
        <View style={styles.modal}>
          {selectedPassenger && (
            <>
              <Text style={styles.modalTitle}>{selectedPassenger.name}</Text>
              <Text>Seat: {selectedPassenger.seat}</Text>
              <Text>From: {selectedPassenger.fromStop}</Text>
              <Text>To: {selectedPassenger.toStop}</Text>
              <Text>Status: {selectedPassenger.status}</Text>

              {selectedPassenger.status === 'PENDING' && (
                <>
                  <TouchableOpacity
                    style={styles.confirmBtn}
                    onPress={() => {
                      updateStatus(selectedPassenger.id, 'BOARDED');
                      setShowPassengerModal(false);
                    }}
                  >
                    <Text style={{ color: '#fff' }}>CONFIRM BOARDING</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.missedBtn}
                    onPress={() => {
                      updateStatus(selectedPassenger.id, 'MISSED');
                      setShowPassengerModal(false);
                    }}
                  >
                    <Text style={{ color: '#fff' }}>MARK MISSED</Text>
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setShowPassengerModal(false)}
              >
                <Text>CLOSE</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default BoardingScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollView: { padding: 16 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  statusContainer: { marginBottom: 20 },
  filterContainer: { flexDirection: 'row', marginBottom: 20 },
  filterBtn: {
    padding: 10,
    backgroundColor: '#ddd',
    marginRight: 10,
    borderRadius: 6,
  },
  activeFilter: { backgroundColor: '#1A237E' },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 12,
    borderRadius: 8,
  },
  name: { fontWeight: 'bold', fontSize: 16 },
  modal: { flex: 1, padding: 20 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  confirmBtn: {
    backgroundColor: 'green',
    padding: 15,
    marginTop: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  missedBtn: {
    backgroundColor: 'red',
    padding: 15,
    marginTop: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeBtn: {
    marginTop: 20,
    alignItems: 'center',
  },
});