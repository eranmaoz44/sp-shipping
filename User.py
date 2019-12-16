from UserWithHashPassword import UserWithHashPassword


class User(object):
    def __init__(self, id, password):
        self.id = id
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

    def is_active(self):
        return UserWithHashPassword.get_element_with_id(self.id) is not None

    def is_anonymous(self):
        return self.is_anonymous

    def get_id(self):
        return self.id



