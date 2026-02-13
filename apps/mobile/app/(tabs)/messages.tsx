import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Conversation {
  id: string;
  title: string;
  subtitle: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  type: "coordination" | "group" | "peer";
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
}

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const SAMPLE_CONVERSATIONS: Conversation[] = [
  {
    id: "coord-1",
    title: "Coordination Centre",
    subtitle: "OECS Emergency Response",
    lastMessage: "All students: please check in with your current status.",
    timestamp: "2 min ago",
    unread: 1,
    type: "coordination",
    icon: "radio",
    iconColor: "#ef4444",
  },
  {
    id: "group-1",
    title: "University of Havana Group",
    subtitle: "12 members",
    lastMessage: "Everyone safe at the university campus.",
    timestamp: "15 min ago",
    unread: 3,
    type: "group",
    icon: "people",
    iconColor: "#3b82f6",
  },
  {
    id: "group-2",
    title: "Barbados Programme",
    subtitle: "28 members",
    lastMessage: "Weather advisory updated for this weekend.",
    timestamp: "1 hr ago",
    unread: 0,
    type: "group",
    icon: "people",
    iconColor: "#a855f7",
  },
  {
    id: "peer-1",
    title: "Sarah Chen",
    subtitle: "University of Trinidad",
    lastMessage: "Are you near the meeting point?",
    timestamp: "3 hrs ago",
    unread: 0,
    type: "peer",
    icon: "person",
    iconColor: "#22c55e",
  },
  {
    id: "peer-2",
    title: "Marcus Williams",
    subtitle: "University of Jamaica",
    lastMessage: "Stay safe out there!",
    timestamp: "Yesterday",
    unread: 0,
    type: "peer",
    icon: "person",
    iconColor: "#f59e0b",
  },
];

// ---------------------------------------------------------------------------
// Conversation row component
// ---------------------------------------------------------------------------

function ConversationRow({ item }: { item: Conversation }) {
  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.6}>
      <View style={[styles.avatar, { backgroundColor: item.iconColor + "20" }]}>
        <Ionicons name={item.icon} size={22} color={item.iconColor} />
      </View>
      <View style={styles.rowContent}>
        <View style={styles.rowTop}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.rowTimestamp}>{item.timestamp}</Text>
        </View>
        <Text style={styles.rowSubtitle} numberOfLines={1}>
          {item.subtitle}
        </Text>
        <Text style={styles.rowMessage} numberOfLines={1}>
          {item.lastMessage}
        </Text>
      </View>
      {item.unread > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadText}>{item.unread}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = SAMPLE_CONVERSATIONS.filter(
    (c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const renderItem = useCallback(
    ({ item }: { item: Conversation }) => <ConversationRow item={item} />,
    [],
  );

  const keyExtractor = useCallback((item: Conversation) => item.id, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <TouchableOpacity style={styles.composeButton}>
          <Ionicons name="create-outline" size={22} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#64748b" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations..."
          placeholderTextColor="#64748b"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={18} color="#64748b" />
          </TouchableOpacity>
        )}
      </View>

      {/* Priority banner */}
      <View style={styles.priorityBanner}>
        <Ionicons name="megaphone" size={16} color="#f59e0b" />
        <Text style={styles.priorityText}>
          Priority messages from the Coordination Centre appear first
        </Text>
      </View>

      {/* Conversation list */}
      <FlatList
        data={filteredConversations}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={48} color="#64748b" />
            <Text style={styles.emptyText}>No conversations found</Text>
          </View>
        }
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#e2e8f0",
  },
  composeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#16213e",
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#16213e",
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#e2e8f0",
  },
  priorityBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f59e0b10",
    marginHorizontal: 20,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  priorityText: {
    flex: 1,
    fontSize: 11,
    color: "#f59e0b",
    fontWeight: "500",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  rowContent: {
    flex: 1,
  },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#e2e8f0",
    flex: 1,
    marginRight: 8,
  },
  rowTimestamp: {
    fontSize: 11,
    color: "#64748b",
  },
  rowSubtitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 1,
  },
  rowMessage: {
    fontSize: 13,
    color: "#94a3b8",
    marginTop: 4,
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
  },
  separator: {
    height: 1,
    backgroundColor: "#1e293b",
    marginLeft: 62,
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    color: "#64748b",
  },
});
