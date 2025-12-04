import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { requireAdmin } from '../../_auth';
import { AgentAllocation } from '@/lib/agent-types';

/**
 * Agent Allocations API
 * 
 * GET /api/admin/agents/allocations
 * - List all agent allocations
 * - Optional filters: agentLevel, wallet
 * 
 * GET /api/admin/agents/allocations/[wallet]
 * - Get specific agent allocation by wallet
 */

export async function GET(request: NextRequest) {
  try {
    const decoded = await requireAdmin(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');
    const agentLevel = searchParams.get('agentLevel'); // '1' or '2'

    // Get specific wallet allocation
    if (wallet) {
      const walletLower = wallet.toLowerCase();
      const allocationQuery = await adminDb.collection('agent_allocations')
        .where('wallet', '==', walletLower)
        .limit(1)
        .get();

      if (allocationQuery.empty) {
        return NextResponse.json({
          success: true,
          allocation: null,
        });
      }

      const allocationDoc = allocationQuery.docs[0];
      const allocation = {
        id: allocationDoc.id,
        ...allocationDoc.data(),
      } as AgentAllocation;

      // Get KOL profile info
      let kolProfile = null;
      if (allocation.kolId) {
        const kolDoc = await adminDb.collection('kol_profiles').doc(allocation.kolId).get();
        if (kolDoc.exists) {
          kolProfile = {
            id: kolDoc.id,
            ...kolDoc.data(),
          };
        }
      }

      return NextResponse.json({
        success: true,
        allocation,
        kolProfile,
      });
    }

    // Get all allocations with optional filter
    let query = adminDb.collection('agent_allocations') as any;
    
    if (agentLevel) {
      query = query.where('agentLevel', '==', parseInt(agentLevel));
    }

    const allocationsSnapshot = await query.orderBy('allocatedAt', 'desc').get();

    const allocations = await Promise.all(
      allocationsSnapshot.docs.map(async (doc) => {
        const allocation = {
          id: doc.id,
          ...doc.data(),
        } as AgentAllocation;

        // Get KOL profile info
        let kolProfile = null;
        if (allocation.kolId) {
          const kolDoc = await adminDb.collection('kol_profiles').doc(allocation.kolId).get();
          if (kolDoc.exists) {
            kolProfile = {
              id: kolDoc.id,
              displayName: kolDoc.data()?.displayName,
              refCode: kolDoc.data()?.refCode,
              email: kolDoc.data()?.email,
            };
          }
        }

        return {
          allocation,
          kolProfile,
        };
      })
    );

    // Calculate totals
    const totals = allocations.reduce(
      (acc, item) => {
        acc.totalPreGVT += item.allocation.preGVTAllocated;
        acc.totalSGVT += item.allocation.sGVTAllocated;
        acc.masterCount += item.allocation.agentLevel === 1 ? 1 : 0;
        acc.subAgentCount += item.allocation.agentLevel === 2 ? 1 : 0;
        return acc;
      },
      {
        totalPreGVT: 0,
        totalSGVT: 0,
        masterCount: 0,
        subAgentCount: 0,
      }
    );

    return NextResponse.json({
      success: true,
      allocations,
      totals,
      count: allocations.length,
    });
  } catch (error: any) {
    console.error('Error fetching agent allocations:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

