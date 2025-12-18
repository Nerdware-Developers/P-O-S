// Simple authentication using localStorage
export const checkAuth = () => {
  const user = localStorage.getItem('pos_user')
  return !!user
}

export const getCurrentUser = () => {
  const user = localStorage.getItem('pos_user')
  return user ? JSON.parse(user) : null
}

export const setAuth = (user) => {
  localStorage.setItem('pos_user', JSON.stringify(user))
}

export const logout = () => {
  localStorage.removeItem('pos_user')
}

