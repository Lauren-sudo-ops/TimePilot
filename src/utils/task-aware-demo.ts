import { 
  Task, 
  StudyPlan, 
  StudySession, 
  UserSettings, 
  FixedCommitment 
} from '../types';
import { createTaskAwareRedistributionEngine } from './task-aware-redistribution';

/**
 * Demonstration of Task-Aware Redistribution
 * 
 * This function demonstrates how the task-aware redistribution system properly handles
 * the scenario you described:
 * 
 * Scenario: 4-hour task due in 4 days (1h/day planned)
 * - Day 1: Completed 1h session ✓
 * - Day 2: Missed 1h session ✗  
 * - Remaining: 3h total work (not just moving the 1h missed session)
 * 
 * The task-aware system will:
 * 1. Recognize that you have 3h remaining work, not just 1h to redistribute
 * 2. Remove all incomplete sessions for that task
 * 3. Re-plan the full 3h optimally across available days
 */

export async function demonstrateTaskAwareRedistribution(): Promise<void> {
  console.log('=== Task-Aware Redistribution Demonstration ===\n');

  // Set up example scenario
  const settings: UserSettings = {
    dailyAvailableHours: 6,
    studyWindowStartHour: 9,
    studyWindowEndHour: 17,
    workDays: [1, 2, 3, 4, 5], // Monday to Friday
    bufferDays: 0,
    minSessionLength: 30
  };

  const fixedCommitments: FixedCommitment[] = [];

  // Create a 4-hour task due in 4 days
  const today = new Date().toISOString().split('T')[0];
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 4);
  
  const task: Task = {
    id: 'task-1',
    title: 'Important Project',
    description: 'A 4-hour task due in 4 days',
    deadline: deadline.toISOString(),
    importance: true,
    estimatedHours: 4,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  // Create study plans showing the scenario
  const day1 = new Date();
  const day2 = new Date();
  day2.setDate(day2.getDate() + 1);
  const day3 = new Date();
  day3.setDate(day3.getDate() + 2);
  const day4 = new Date();
  day4.setDate(day4.getDate() + 3);

  const studyPlans: StudyPlan[] = [
    {
      id: 'plan-day1',
      date: day1.toISOString().split('T')[0],
      plannedTasks: [
        {
          taskId: 'task-1',
          scheduledTime: `${day1.toISOString().split('T')[0]} 09:00`,
          startTime: '09:00',
          endTime: '10:00',
          allocatedHours: 1,
          sessionNumber: 1,
          done: true, // ✓ Completed
          status: 'completed',
          actualHours: 1,
          completedAt: new Date().toISOString()
        }
      ],
      totalStudyHours: 1,
      availableHours: 6
    },
    {
      id: 'plan-day2',
      date: day2.toISOString().split('T')[0],
      plannedTasks: [
        {
          taskId: 'task-1',
          scheduledTime: `${day2.toISOString().split('T')[0]} 09:00`,
          startTime: '09:00',
          endTime: '10:00',
          allocatedHours: 1,
          sessionNumber: 2,
          done: false, // ✗ Missed (day is in the past)
          status: 'missed'
        }
      ],
      totalStudyHours: 1,
      availableHours: 6
    },
    {
      id: 'plan-day3',
      date: day3.toISOString().split('T')[0],
      plannedTasks: [
        {
          taskId: 'task-1',
          scheduledTime: `${day3.toISOString().split('T')[0]} 09:00`,
          startTime: '09:00',
          endTime: '10:00',
          allocatedHours: 1,
          sessionNumber: 3,
          done: false,
          status: 'scheduled'
        }
      ],
      totalStudyHours: 1,
      availableHours: 6
    },
    {
      id: 'plan-day4',
      date: day4.toISOString().split('T')[0],
      plannedTasks: [
        {
          taskId: 'task-1',
          scheduledTime: `${day4.toISOString().split('T')[0]} 09:00`,
          startTime: '09:00',
          endTime: '10:00',
          allocatedHours: 1,
          sessionNumber: 4,
          done: false,
          status: 'scheduled'
        }
      ],
      totalStudyHours: 1,
      availableHours: 6
    }
  ];

  console.log('📊 INITIAL STATE:');
  console.log(`Task: "${task.title}" - ${task.estimatedHours}h total`);
  console.log(`Day 1: 1h completed ✓`);
  console.log(`Day 2: 1h missed ✗`);
  console.log(`Day 3: 1h planned (future)`);
  console.log(`Day 4: 1h planned (future)`);
  console.log(`Total completed: 1h`);
  console.log(`Total remaining: 3h\n`);

  // Simulate day 2 being in the past (missed session)
  studyPlans[1].date = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Create task-aware redistribution engine
  const taskAwareEngine = createTaskAwareRedistributionEngine(settings, fixedCommitments);

  // Run task-aware redistribution
  console.log('🔄 RUNNING TASK-AWARE REDISTRIBUTION...\n');
  
  const result = await taskAwareEngine.redistributeTasksWithMissedSessions(studyPlans, [task]);

  console.log('📋 REDISTRIBUTION RESULT:');
  console.log(`Success: ${result.success}`);
  console.log(`Message: ${result.feedback.message}`);
  console.log(`Tasks processed: ${result.feedback.details.tasksProcessed}`);
  console.log(`Total hours redistributed: ${result.feedback.details.totalHoursRedistributed}h\n`);

  if (result.success && result.redistribution[task.id]) {
    const taskRedist = result.redistribution[task.id];
    
    console.log('🗑️  REMOVED SESSIONS:');
    taskRedist.removedSessions.forEach(session => {
      console.log(`  - Session ${session.sessionNumber}: ${session.allocatedHours}h (${session.status})`);
    });
    
    console.log('\n✨ NEW SESSIONS:');
    taskRedist.newSessions.forEach(session => {
      const date = session.scheduledTime.split(' ')[0];
      console.log(`  - ${date}: ${session.allocatedHours}h (${session.startTime}-${session.endTime})`);
    });
    
    console.log('\n🎯 KEY INSIGHT:');
    console.log('The system correctly recognized that you have 3h remaining work total,');
    console.log('not just 1h missed session to move. It removed all incomplete sessions');
    console.log('and re-planned the full 3h optimally across available days.');
    
    // Verify the math
    const totalRedistributed = taskRedist.newSessions.reduce((sum, s) => sum + s.allocatedHours, 0);
    console.log(`\n✅ VERIFICATION:`);
    console.log(`Original task: ${task.estimatedHours}h`);
    console.log(`Completed: 1h`);
    console.log(`Remaining: ${task.estimatedHours - 1}h`);
    console.log(`Redistributed: ${totalRedistributed}h`);
    console.log(`Math checks out: ${totalRedistributed === (task.estimatedHours - 1) ? '✓' : '✗'}`);
  }

  console.log('\n=== COMPARISON ===');
  console.log('❌ SESSION-BASED APPROACH:');
  console.log('  - Would only move the 1h missed session');
  console.log('  - Final schedule: 1h completed + 1h redistributed + 1h day3 + 1h day4 = 4h');
  console.log('  - Problem: Suboptimal distribution, doesn\'t consider total remaining work');
  
  console.log('\n✅ TASK-AWARE APPROACH:');
  console.log('  - Recognizes 3h total remaining work');
  console.log('  - Removes all incomplete sessions (missed + future planned)');
  console.log('  - Re-plans 3h optimally across available days');
  console.log('  - Result: Better distribution that reflects actual remaining work');
}

/**
 * Test the specific scenario mentioned by the user
 */
export async function testUserScenario(): Promise<void> {
  console.log('\n=== TESTING USER SCENARIO ===');
  console.log('4hr task due in 4 days, completed 1h, missed 1h, should have 3h remaining\n');
  
  await demonstrateTaskAwareRedistribution();
}

// Run demonstration if this file is executed directly
if (require.main === module) {
  demonstrateTaskAwareRedistribution().catch(console.error);
}
