import React from 'react'
import LayoutComponent from './components/layout'
import { Routes, Route } from 'react-router-dom'
import ConnectionsList from './pages/connections/list'
import ConnectionsCreate from './pages/connections/create'
import ConnectionsEdit from './pages/connections/edit'
import ConnectionsShow from './pages/connections/show'
import SqlEditorPage from './pages/sql-editor'

const App: React.FC = () => {
  return (
    <Routes>
      <Route
        path="/connections"
        element={
          <LayoutComponent>
            <ConnectionsList />
          </LayoutComponent>
        }
      />
      <Route
        path="/connections/create"
        element={
          <LayoutComponent>
            <ConnectionsCreate />
          </LayoutComponent>
        }
      />
      <Route
        path="/connections/edit/:id"
        element={
          <LayoutComponent>
            <ConnectionsEdit />
          </LayoutComponent>
        }
      />
      <Route
        path="/connections/show/:id"
        element={
          <LayoutComponent>
            <ConnectionsShow />
          </LayoutComponent>
        }
      />
      <Route
        path="/sql-editor"
        element={
          <LayoutComponent>
            <SqlEditorPage />
          </LayoutComponent>
        }
      />
      <Route
        path="/"
        element={
          <LayoutComponent>
            <SqlEditorPage />
          </LayoutComponent>
        }
      />
    </Routes>
  )
}

export default App
