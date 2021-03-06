import UserModel, { User } from '@src/models/User';

describe('Users functional tests', () => {
  beforeEach(async () => await UserModel.deleteMany());

  it('should successfully save a new user', async () => {
    const user: User = {
      name: 'John Doe',
      email: 'john@mail.com',
      password: 'Password@123',
    };

    const response = await global.testRequest.post('/users').send(user);
    expect(response.status).toBe(201);

    delete user.password;

    expect(response.body).toEqual(expect.objectContaining(user));
  });

  it('Should return 422 when there is a validation error', async () => {
    const user = {
      name: 'John Doe',
      email: 'john@mail.com',
    };

    const response = await global.testRequest.post('/users').send(user);
    expect(response.status).toBe(422);
    expect(response.body).toEqual({
      code: 422,
      error: 'Unprocessable Entity',
      message: 'User validation failed: password: Path `password` is required.',
    });
  });

  it('Should return 409 when the email already exists', async () => {
    const user = {
      name: 'John Doe',
      email: 'john@mail.com',
      password: '1234',
    };

    // First: save new USER 01
    await global.testRequest.post('/users').send(user);

    // Seconds: save new USER 02
    const response = await global.testRequest.post('/users').send(user);

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      code: 409,
      error: 'Conflict',
      message: 'User validation failed: email: already exists in the database.',
    });
  });
});
