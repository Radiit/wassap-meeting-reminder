const commandService = require('../src/services/commandService');
const Meeting = require('../src/models/Meeting');
const Group = require('../src/models/Group');
const googleCalendarService = require('../src/services/googleCalendarService');
const whatsappService = require('../src/services/whatsappService');
const reminderService = require('../src/services/reminderService');

// Mock dependencies
jest.mock('../src/models/Meeting');
jest.mock('../src/models/Group');
jest.mock('../src/services/googleCalendarService');
jest.mock('../src/services/whatsappService');
jest.mock('../src/services/reminderService');

describe('Command Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('processMessage', () => {
    it('should return null for non-command messages', async () => {
      const messageData = {
        messageText: 'This is not a command',
        sender: '123456789',
        groupId: 'group_123'
      };

      const result = await commandService.processMessage(messageData);

      expect(result).toBeNull();
    });

    it('should return null if no messageText', async () => {
      const messageData = {
        messageText: '',
        sender: '123456789',
        groupId: 'group_123'
      };

      const result = await commandService.processMessage(messageData);

      expect(result).toBeNull();
    });

    it('should return null if no groupId', async () => {
      const messageData = {
        messageText: '/set-meeting tomorrow at 3pm Meeting',
        sender: '123456789',
        groupId: null
      };

      const result = await commandService.processMessage(messageData);

      expect(result).toBeNull();
    });

    it('should call processMeetingCommand for set-meeting command', async () => {
      const messageData = {
        messageText: '/set-meeting tomorrow at 3pm Meeting',
        sender: '123456789',
        groupId: 'group_123'
      };

      // Mock implementation
      const mockResult = { success: true, message: 'Meeting scheduled' };
      jest.spyOn(commandService, 'processMeetingCommand').mockResolvedValueOnce(mockResult);

      const result = await commandService.processMessage(messageData);

      expect(commandService.processMeetingCommand).toHaveBeenCalledWith(
        messageData.messageText,
        messageData.sender,
        messageData.groupId
      );
      expect(result).toEqual(mockResult);
    });

    it('should call listMeetingsCommand for list-meetings command', async () => {
      const messageData = {
        messageText: '/list-meetings',
        sender: '123456789',
        groupId: 'group_123'
      };

      // Mock implementation
      const mockResult = { success: true, message: 'Meetings listed' };
      jest.spyOn(commandService, 'listMeetingsCommand').mockResolvedValueOnce(mockResult);

      const result = await commandService.processMessage(messageData);

      expect(commandService.listMeetingsCommand).toHaveBeenCalledWith(messageData.groupId);
      expect(result).toEqual(mockResult);
    });

    it('should call cancelMeetingCommand for cancel-meeting command', async () => {
      const messageData = {
        messageText: '/cancel-meeting 1',
        sender: '123456789',
        groupId: 'group_123'
      };

      // Mock implementation
      const mockResult = { success: true, message: 'Meeting cancelled' };
      jest.spyOn(commandService, 'cancelMeetingCommand').mockResolvedValueOnce(mockResult);

      const result = await commandService.processMessage(messageData);

      expect(commandService.cancelMeetingCommand).toHaveBeenCalledWith(
        messageData.messageText,
        messageData.sender,
        messageData.groupId
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('processMeetingCommand', () => {
    it('should create a new group if it does not exist', async () => {
      // Mock Group.findOne to return null (group doesn't exist)
      Group.findOne.mockResolvedValueOnce(null);

      // Mock Group constructor and save method
      const mockGroup = {
        save: jest.fn().mockResolvedValueOnce({}),
        whatsappId: 'group_123',
        name: 'Group group_1...',
        calendarId: 'primary'
      };
      Group.mockImplementationOnce(() => mockGroup);

      // Mock chrono.id.parse
      const mockDate = new Date('2023-12-31T15:00:00Z');
      jest.mock('chrono-node', () => ({
        id: {
          parse: jest.fn().mockReturnValueOnce([{
            start: { date: () => mockDate },
            text: 'tomorrow at 3pm'
          }])
        }
      }));

      // Mock Meeting constructor and save
      const mockMeeting = {
        save: jest.fn().mockResolvedValueOnce({}),
        title: 'Meeting',
        startTime: mockDate,
        endTime: new Date(mockDate.getTime() + 60 * 60 * 1000),
        googleCalendarEventId: 'event_123'
      };
      Meeting.mockImplementationOnce(() => mockMeeting);

      // Mock Google Calendar service
      googleCalendarService.createEvent.mockResolvedValueOnce({ id: 'event_123' });

      // Mock WhatsApp service
      whatsappService.sendMeetingConfirmation.mockResolvedValueOnce({});

      // Mock reminder service
      reminderService.scheduleReminder.mockResolvedValueOnce();

      const messageText = '/set-meeting tomorrow at 3pm Meeting';
      const sender = '123456789';
      const groupId = 'group_123';

      const result = await commandService.processMeetingCommand(messageText, sender, groupId);

      // Check if a new group was created
      expect(Group).toHaveBeenCalledWith({
        whatsappId: groupId,
        name: expect.any(String),
        members: [{ phoneNumber: sender, isAdmin: true }]
      });
      expect(mockGroup.save).toHaveBeenCalled();

      // Check if the meeting was created
      expect(Meeting).toHaveBeenCalledWith(expect.objectContaining({
        title: expect.any(String),
        startTime: mockDate,
        endTime: expect.any(Date),
        createdBy: sender,
        groupId
      }));

      // Check if Google Calendar event was created
      expect(googleCalendarService.createEvent).toHaveBeenCalled();

      // Check if confirmation was sent
      expect(whatsappService.sendMeetingConfirmation).toHaveBeenCalledWith(groupId, mockMeeting);

      // Check if reminder was scheduled
      expect(reminderService.scheduleReminder).toHaveBeenCalledWith(mockMeeting, mockGroup);

      // Check the result
      expect(result).toEqual({
        success: true,
        meeting: mockMeeting,
        message: expect.any(String)
      });
    });

    it('should handle invalid date format', async () => {
      // Mock Group.findOne to return a group
      const mockGroup = {
        whatsappId: 'group_123',
        name: 'Test Group',
        calendarId: 'primary'
      };
      Group.findOne.mockResolvedValueOnce(mockGroup);

      // Mock chrono.id.parse to return empty array (invalid date)
      jest.mock('chrono-node', () => ({
        id: {
          parse: jest.fn().mockReturnValueOnce([])
        }
      }));

      const messageText = '/set-meeting invalid date format';
      const sender = '123456789';
      const groupId = 'group_123';

      const result = await commandService.processMeetingCommand(messageText, sender, groupId);

      // Check that no meeting was created
      expect(Meeting).not.toHaveBeenCalled();
      expect(googleCalendarService.createEvent).not.toHaveBeenCalled();
      expect(whatsappService.sendMeetingConfirmation).not.toHaveBeenCalled();

      // Check the error result
      expect(result).toEqual({
        success: false,
        message: expect.stringContaining('Format tanggal dan waktu tidak valid')
      });
    });
  });

  // Additional tests for listMeetingsCommand and cancelMeetingCommand would follow a similar pattern
});