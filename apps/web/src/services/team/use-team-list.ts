'use client';

import { useEffect, useState } from 'react';
import type { TeamEvent } from '@repo/shared';
import { getTeamErrorMessage } from './team.error';
import { applyTeamEvent, teamService } from './team.service';
import type { Team } from './team.type';

export function useTeamList(contestId: string) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;
    let loadId = 0;
    const events: TeamEvent[] = [];

    async function load() {
      const id = ++loadId;
      const seen = events.length;

      try {
        const data = await teamService.list(contestId);
        if (!active || id !== loadId) return;
        const missed = events.slice(seen);
        setTeams(missed.reduce(applyTeamEvent, data));
        setError(undefined);
      } catch (loadError) {
        if (!active || id !== loadId) return;
        setError(
          getTeamErrorMessage(
            loadError,
            'Não foi possível carregar os competidores.',
          ),
        );
      } finally {
        if (active && id === loadId) setLoading(false);
      }
    }

    setLoading(true);
    void load();

    const source = new EventSource(teamService.getEventsUrl(contestId), {
      withCredentials: true,
    });

    source.onopen = () => {
      void load();
    };

    source.onmessage = (message) => {
      if (!active) return;
      const event = teamService.parseEventData(message.data);
      if (!event) return;
      events.push(event);
      setTeams((current) => applyTeamEvent(current, event));
    };

    source.onerror = () => {
      // Browser reconnects EventSource automatically.
    };

    return () => {
      active = false;
      source.close();
    };
  }, [contestId]);

  return { teams, setTeams, loading, error, setError };
}
