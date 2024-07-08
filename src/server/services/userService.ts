export const userService = {
    authenticate,
  };
  

  function  authenticate(username: string) {
    const user = {
      id: 1,
      name: username,
    }
  
    return user;
  }