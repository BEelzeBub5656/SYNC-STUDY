import { StyleSheet, Text, View } from 'react-native';

    export default function ProfileScreen() {
    return (
        <View style={styles.container}>
        <Text style={styles.title}>我的页面</Text>
        </View>
    );
    }

    const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
    },
    });