from UserWithHashPassword import UserWithHashPassword


class User(object):
    def __init__(self, user_id, password):
        self.id = user_id
        self.password = password
        self.is_authenticated_bool = False
        self.userWithPasswordHash = None
        self.is_anonymous = False

    def is_authenticated(self):
        if not self.is_authenticated_bool:
            if self.userWithPasswordHash is None:
                self.userWithPasswordHash = UserWithHashPassword.get_element_with_id(self.id)
            if self.userWithPasswordHash is not None:
                self.is_authenticated_bool = self.userWithPasswordHash.check_password(self.password)
        return self.is_authenticated_bool

    @classmethod
    def from_id(cls, user_id):
        user_with_hash = UserWithHashPassword.get_element_with_id(user_id)
        if user_with_hash is None:
            return None
        user = cls(user_id, None)
        user.userWithPasswordHash = user_with_hash
        user.is_authenticated_bool = True
        return user

    def is_active(self):
        return UserWithHashPassword.get_element_with_id(self.id) is not None

    def is_anonymous(self):
        return self.is_anonymous

    def get_id(self):
        return self.id



