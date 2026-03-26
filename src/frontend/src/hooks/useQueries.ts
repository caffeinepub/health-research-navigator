import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";

export function useAllSessions() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllSessions();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useDeleteSession() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteSession(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}
