import { StyleSheet, Text, View } from 'react-native';

    export default function CommunityScreen() {
    return (
        <View style={styles.container}>
        <Text style={styles.title}>社区页面</Text>
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