-- 创建数据库（如果不存在）
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'db_query')
BEGIN
    CREATE DATABASE db_query;
END
GO

-- 切换到db_query数据库
USE db_query;
GO

-- 创建connections表
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[connections]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[connections] (
        [id] BIGINT IDENTITY(1,1) NOT NULL,
        [connection_name] NVARCHAR(100) NOT NULL,
        [host] NVARCHAR(255) NOT NULL,
        [port] INT NOT NULL,
        [database_name] NVARCHAR(255) NOT NULL,
        [username] NVARCHAR(255) NOT NULL,
        [password] NVARCHAR(255) NOT NULL,
        [database_type] NVARCHAR(50) NOT NULL,
        [created_at] DATETIME2(6) DEFAULT GETDATE(),
        [updated_at] DATETIME2(6) DEFAULT GETDATE(),
        CONSTRAINT [PK_connections] PRIMARY KEY CLUSTERED ([id] ASC)
    );
END
GO

-- 创建metadata表
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[metadata]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[metadata] (
        [id] BIGINT IDENTITY(1,1) NOT NULL,
        [connection_id] BIGINT NOT NULL,
        [table_name] NVARCHAR(255) NOT NULL,
        [table_type] NVARCHAR(50) NOT NULL,
        [columns] NVARCHAR(MAX) NOT NULL,
        [created_at] DATETIME2(6) DEFAULT GETDATE(),
        [updated_at] DATETIME2(6) DEFAULT GETDATE(),
        CONSTRAINT [PK_metadata] PRIMARY KEY CLUSTERED ([id] ASC),
        CONSTRAINT [FK_metadata_connection] FOREIGN KEY ([connection_id]) REFERENCES [dbo].[connections]([id]) ON DELETE CASCADE
    );
END
GO

-- 创建索引
CREATE INDEX [IX_metadata_connection_id] ON [dbo].[metadata] ([connection_id]);
CREATE INDEX [IX_metadata_connection_id_table_name] ON [dbo].[metadata] ([connection_id], [table_name]);
GO

-- 插入示例数据
IF NOT EXISTS (SELECT * FROM [dbo].[connections])
BEGIN
    INSERT INTO [dbo].[connections] ([connection_name], [host], [port], [database_name], [username], [password], [database_type])
    VALUES 
        ('本地SQL Server', 'localhost', 1433, 'master', 'sa', 'Password123!', 'sqlserver'),
        ('本地MySQL', 'localhost', 3306, 'test', 'root', 'password', 'mysql'),
        ('本地PostgreSQL', 'localhost', 5432, 'test', 'postgres', 'password', 'postgresql');
END
GO
