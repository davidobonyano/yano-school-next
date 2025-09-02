import { useEffect, useState } from 'react';
import { useGlobalAcademicContext } from '@/contexts/GlobalAcademicContext';
import { useAcademicContext } from '@/lib/academic-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Play } from 'lucide-react';

export function ContextSyncStatus() {
  const { academicContext: globalContext } = useGlobalAcademicContext();
  const { currentContext: localContext, isLoading } = useAcademicContext();
  // Avoid SSR/client time mismatch by setting after mount
  const [hasMounted, setHasMounted] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'out-of-sync' | 'loading'>('loading');
  const [testResult, setTestResult] = useState<string>('');

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (isLoading) {
      setSyncStatus('loading');
      return;
    }

    if (!globalContext || !localContext) {
      setSyncStatus('out-of-sync');
      return;
    }

    const isSynced = 
      globalContext.session === localContext.session_name &&
      globalContext.term === localContext.term_name &&
      globalContext.sessionId === localContext.session_id &&
      globalContext.termId === localContext.term_id;

    setSyncStatus(isSynced ? 'synced' : 'out-of-sync');
    
    if (isSynced) {
      // Set last sync time on client only
      setLastSync(new Date());
    }
  }, [globalContext, localContext, isLoading]);

  // Test function to verify API endpoints are working
  const testActivation = async () => {
    setTestResult('Testing...');
    try {
      // First, get debug info
      const debugResponse = await fetch('/api/debug/session-activation');
      const debugData = await debugResponse.json();
      
      if (!debugData.success) {
        setTestResult(`❌ Debug failed: ${debugData.error}`);
        return;
      }

      const debug = debugData.debug;
      let result = '';

      // Check sessions
      if (debug.sessions.count === 0) {
        result += '❌ No sessions found\n';
      } else {
        result += `✅ Found ${debug.sessions.count} sessions\n`;
      }

      // Check terms
      if (debug.terms.count === 0) {
        result += '❌ No terms found\n';
      } else {
        result += `✅ Found ${debug.terms.count} terms\n`;
      }

      // Check functions
      if (debug.functions.get_all_academic_sessions === 'FAILED') {
        result += '❌ Database functions missing\n';
      } else {
        result += '✅ Database functions exist\n';
      }

      // Test activation if we have a session
      const sessionId = globalContext?.sessionId || localContext?.session_id;
      if (sessionId) {
        const testResponse = await fetch('/api/debug/session-activation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId,
            test_activation: true
          })
        });

        const testData = await testResponse.json();
        if (testData.success && testData.debug.activationResult.success) {
          result += '✅ Session activation working\n';
        } else {
          result += `❌ Session activation failed: ${testData.debug.activationResult.error}\n`;
        }
      } else {
        result += '⚠️ No session ID available for testing\n';
      }

      setTestResult(result);
    } catch (error) {
      setTestResult(`❌ Test failed: ${error}`);
    }
  };

  const getStatusIcon = () => {
    switch (syncStatus) {
      case 'synced':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'out-of-sync':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'loading':
        return <RefreshCw className="w-5 h-5 text-yellow-500 animate-spin" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (syncStatus) {
      case 'synced':
        return 'Contexts are synchronized';
      case 'out-of-sync':
        return 'Contexts are out of sync';
      case 'loading':
        return 'Checking sync status...';
      default:
        return 'Unknown status';
    }
  };

  const getStatusColor = () => {
    switch (syncStatus) {
      case 'synced':
        return 'bg-green-100 text-green-800';
      case 'out-of-sync':
        return 'bg-red-100 text-red-800';
      case 'loading':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Context Sync Status
        </CardTitle>
        <CardDescription>
          Monitor synchronization between global and local academic contexts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status:</span>
          <Badge className={getStatusColor()}>
            {getStatusText()}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="text-sm">
            <span className="font-medium">Global Context:</span>
            <div className="ml-2 text-gray-600">
              <div>Session: {globalContext?.session || 'N/A'}</div>
              <div>Term: {globalContext?.term || 'N/A'}</div>
            </div>
          </div>
          
          <div className="text-sm">
            <span className="font-medium">Local Context:</span>
            <div className="ml-2 text-gray-600">
              <div>Session: {localContext?.session_name || 'N/A'}</div>
              <div>Term: {localContext?.term_name || 'N/A'}</div>
            </div>
          </div>
        </div>

        <div className="text-xs text-gray-500">
          Last synced: {hasMounted && lastSync
            ? lastSync.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            : '—'}
        </div>

        {/* Test Button */}
        <div className="pt-2">
          <Button 
            onClick={testActivation} 
            size="sm" 
            variant="outline"
            className="w-full"
          >
            <Play className="w-4 h-4 mr-2" />
            Test Activation API
          </Button>
          {testResult && (
            <div className="mt-2 text-xs p-2 bg-gray-50 rounded">
              {testResult}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
