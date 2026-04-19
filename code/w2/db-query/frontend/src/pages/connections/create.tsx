import React from 'react'
import { Create, useForm } from '@refinedev/antd'
import { Form, Input, InputNumber } from 'antd'
import type { ConnectionFormData } from '../../types/connection'

const ConnectionsCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm<ConnectionFormData>()

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item
          label="Name"
          name="name"
          rules={[{ required: true, message: 'Please enter connection name' }]}
        >
          <Input placeholder="Enter connection name" />
        </Form.Item>
        <Form.Item
          label="Host"
          name="host"
          rules={[{ required: true, message: 'Please enter host' }]}
        >
          <Input placeholder="e.g., localhost" />
        </Form.Item>
        <Form.Item
          label="Port"
          name="port"
          initialValue={5432}
          rules={[{ required: true, message: 'Please enter port' }]}
        >
          <InputNumber
            style={{ width: '100%' }}
            min={1}
            max={65535}
            placeholder="e.g., 5432"
          />
        </Form.Item>
        <Form.Item
          label="Database"
          name="database"
          rules={[{ required: true, message: 'Please enter database name' }]}
        >
          <Input placeholder="Enter database name" />
        </Form.Item>
        <Form.Item
          label="Username"
          name="username"
          rules={[{ required: true, message: 'Please enter username' }]}
        >
          <Input placeholder="Enter username" />
        </Form.Item>
        <Form.Item
          label="Password"
          name="password"
          rules={[{ required: true, message: 'Please enter password' }]}
        >
          <Input.Password placeholder="Enter password" />
        </Form.Item>
      </Form>
    </Create>
  )
}

export default ConnectionsCreate
